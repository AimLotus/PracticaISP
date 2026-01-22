<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class InventoryController extends Controller
{
    /**
     * Mostrar listado detallado del inventario.
     */
    public function inventario()
    {
        // Cargar inventarios con productos, impuestos y proveedores
        $inventarios = Inventory::with(['product.tax', 'product.providers'])->get();

        // Verificar stock bajo y crear notificaciones automáticamente
        $this->checkAndCreateNotifications($inventarios);

        // Formatear y retornar la respuesta
        $resultado = $inventarios->map(function ($inv) {
            $producto = $inv->product;
            
            // Obtener el proveedor principal (is_primary = 1) o el primero disponible
            $proveedorPrincipal = $producto->providers->firstWhere('pivot.is_primary', 1) 
                                  ?? $producto->providers->first();

            return [
                'id' => $inv->id,
                'producto_id' => $producto->id,
                'codigo' => $producto->codigo ?? 'Sin código',
                'nombre' => $producto->nombre ?? 'Desconocido',
                'descripcion' => $producto->descripcion ?? '',
                'precio_compra' => (float) ($producto->precio_compra ?? 0),
                'precio_venta' => (float) ($producto->precio_venta ?? 0),
                'stock_actual' => (int) $inv->cantidad,
                'stock_minimo' => (int) ($producto->stock_minimo ?? 0),
                'impuesto' => [
                    'nombre' => $producto->tax->nombre ?? 'Sin impuesto',
                    'porcentaje' => (float) ($producto->tax->porcentaje ?? 0)
                ],
                'proveedor' => $proveedorPrincipal ? [
                    'id' => $proveedorPrincipal->id,
                    'nombre' => $proveedorPrincipal->nombre,
                    'email' => $proveedorPrincipal->email,
                    'contacto' => $proveedorPrincipal->telefono ?? ''
                ] : null
            ];
        });

        return response()->json($resultado);
    }

    /**
     * Verificar stock bajo y crear notificaciones automáticamente
     */
    private function checkAndCreateNotifications($inventarios)
    {
        foreach ($inventarios as $inv) {
            $producto = $inv->product;
            $stockActual = (int) $inv->cantidad;
            $stockMinimo = (int) ($producto->stock_minimo ?? 0);

            // Obtener el proveedor principal o el primero disponible
            $proveedorPrincipal = $producto->providers->firstWhere('pivot.is_primary', 1) 
                                  ?? $producto->providers->first();

            // Si el stock está bajo el mínimo y hay un proveedor asignado
            if ($stockActual < $stockMinimo && $proveedorPrincipal) {
                // Verificar si ya existe una notificación pendiente o aceptada recientemente (últimas 24 horas)
                $existeNotificacion = Notification::where('product_id', $producto->id)
                    ->where(function($query) {
                        $query->where('estado', 'pendiente')
                              ->orWhere(function($q) {
                                  $q->where('estado', 'aceptada')
                                    ->where('fecha_respuesta', '>=', now()->subHours(24));
                              });
                    })
                    ->exists();

                // Si no existe notificación reciente, crear una nueva
                if (!$existeNotificacion) {
                    Notification::create([
                        'user_id' => auth()->id(), // Usuario autenticado que consulta el inventario
                        'product_id' => $producto->id,
                        'provider_id' => $proveedorPrincipal->id,
                        'tipo' => 'stock_bajo',
                        'mensaje' => "El stock de {$producto->nombre} está bajo. Stock actual: {$stockActual}, Stock mínimo: {$stockMinimo}",
                        'estado' => 'pendiente',
                        'cantidad_actual' => $stockActual,
                        'stock_minimo' => $stockMinimo
                    ]);

                    Log::info("Notificación de stock bajo creada automáticamente", [
                        'producto' => $producto->nombre,
                        'stock_actual' => $stockActual,
                        'stock_minimo' => $stockMinimo,
                        'proveedor' => $proveedorPrincipal->nombre,
                        'user_id' => auth()->id()
                    ]);
                }
            }
        }
    }

    /**
     * Verificar stock bajo y enviar correos a proveedores
     */
    public function checkLowStock()
    {
        try {
            // Ejecutar el comando artisan
            Artisan::call('stock:check-low');
            $output = Artisan::output();

            Log::info('Verificación manual de stock bajo ejecutada', [
                'user_id' => auth()->id(),
                'output' => $output
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Verificación de stock completada. Revise los logs para más detalles.',
                'output' => trim($output)
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error al ejecutar verificación de stock bajo', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al verificar el stock: ' . $e->getMessage()
            ], 500);
        }
    }
}
