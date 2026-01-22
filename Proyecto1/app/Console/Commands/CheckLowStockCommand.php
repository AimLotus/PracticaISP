<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class CheckLowStockCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stock:check-low';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica el inventario y crea notificaciones para los usuarios administradores cuando los productos alcanzan el stock mínimo';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Verificando niveles de stock...');
        
        try {
            // Obtener usuarios administradores y dueños
            $adminUsers = User::whereHas('rol', function($query) {
                $query->whereIn('nombre', ['admin', 'dueno']);
            })->get();

            if ($adminUsers->isEmpty()) {
                $this->warn('No hay usuarios administradores o dueños en el sistema.');
                return 0;
            }

            // Obtener productos con stock bajo
            $lowStockProducts = Product::with(['inventory', 'providers'])
                ->whereHas('inventory', function($query) {
                    $query->whereRaw('cantidad <= products.stock_minimo');
                })
                ->where('stock_minimo', '>', 0)
                ->get();

            if ($lowStockProducts->isEmpty()) {
                $this->info('No hay productos con stock bajo.');
                return 0;
            }

            $this->info("Se encontraron {$lowStockProducts->count()} producto(s) con stock bajo.");
            $notificationsCreated = 0;

            foreach ($lowStockProducts as $product) {
                $inventory = $product->inventory;
                
                if (!$inventory) {
                    $this->warn("Producto {$product->nombre} no tiene registro de inventario.");
                    continue;
                }

                $cantidadActual = $inventory->cantidad;
                $stockMinimo = $product->stock_minimo;

                $this->line("- Producto: {$product->nombre} (Stock: {$cantidadActual}/{$stockMinimo})");

                // Obtener el proveedor principal primero
                $primaryProvider = $product->providers()
                    ->wherePivot('is_primary', true)
                    ->first();

                // Si no hay proveedor principal, usar el primero disponible
                $provider = $primaryProvider ?? $product->providers->first();

                if (!$provider) {
                    $this->warn("  ⚠️ Producto sin proveedor asignado.");
                    continue;
                }

                // Crear notificación para cada administrador
                foreach ($adminUsers as $admin) {
                    // Verificar si ya existe una notificación pendiente para este producto
                    $existingNotification = Notification::where('user_id', $admin->id)
                        ->where('product_id', $product->id)
                        ->where('estado', 'pendiente')
                        ->first();

                    if ($existingNotification) {
                        // Actualizar la notificación existente
                        $existingNotification->cantidad_actual = $cantidadActual;
                        $existingNotification->mensaje = "El producto '{$product->nombre}' tiene solo {$cantidadActual} unidades en stock (mínimo: {$stockMinimo}).";
                        $existingNotification->save();
                        $this->line("  ↻ Notificación actualizada para {$admin->name}");
                    } else {
                        // Crear nueva notificación
                        Notification::create([
                            'user_id' => $admin->id,
                            'product_id' => $product->id,
                            'provider_id' => $provider->id,
                            'tipo' => 'stock_bajo',
                            'mensaje' => "El producto '{$product->nombre}' tiene solo {$cantidadActual} unidades en stock (mínimo: {$stockMinimo}).",
                            'cantidad_actual' => $cantidadActual,
                            'stock_minimo' => $stockMinimo,
                            'estado' => 'pendiente',
                            'leida' => false
                        ]);

                        $this->info("  ✓ Notificación creada para {$admin->name}");
                        $notificationsCreated++;
                    }

                    Log::info("Notificación de stock bajo creada/actualizada", [
                        'producto' => $product->nombre,
                        'codigo' => $product->codigo,
                        'cantidad_actual' => $cantidadActual,
                        'stock_minimo' => $stockMinimo,
                        'proveedor' => $provider->nombre,
                        'admin' => $admin->name
                    ]);
                }
            }

            $this->info("\n✓ Proceso completado. Notificaciones creadas: {$notificationsCreated}");
            return 0;

        } catch (\Exception $e) {
            $this->error("Error al verificar stock: {$e->getMessage()}");
            Log::error("Error en CheckLowStockCommand", ['error' => $e->getMessage()]);
            return 1;
        }
    }
}
