<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    /**
     * Verificar stock bajo y crear notificaciones automáticamente
     * @param \Illuminate\Support\Collection|null $inventarios Lista de inventarios precargados (opcional)
     */
    public function checkAndCreateNotifications($inventarios = null)
    {
        // Si no se proveen inventarios, cargarlos todos con sus relaciones necesarias
        if (!$inventarios) {
            $inventarios = Inventory::with(['product.providers'])->get();
        }

        // Determinar el usuario destinatario de las notificaciones
        // Prioridad: 1. Dueño (rol_id 3), 2. Admin (rol_id 1), 3. Auth User, 4. ID 1
        $targetUserId = \App\Models\User::where('rol_id', 3)->where('activo', true)->value('id');

        if (!$targetUserId) {
            $targetUserId = \App\Models\User::where('rol_id', 1)->where('activo', true)->value('id');
        }

        if (!$targetUserId) {
            $targetUserId = auth()->id() ?? 1;
        }

        foreach ($inventarios as $inv) {
            $producto = $inv->product;

            // Skip orphans
            if (!$producto)
                continue;

            $stockActual = (int) $inv->cantidad;
            $stockMinimo = (int) ($producto->stock_minimo ?? 0);

            // Obtener el proveedor principal o el primero disponible
            $proveedorPrincipal = $producto->providers->firstWhere('pivot.is_primary', 1)
                ?? $producto->providers->first();

            // Si el stock está bajo el mínimo y hay un proveedor asignado
            if ($stockActual <= $stockMinimo && $proveedorPrincipal) {
                // Verificar si ya existe una notificación pendiente o aceptada/rechazada recientemente (últimas 24 horas)
                $existeNotificacion = Notification::where('product_id', $producto->id)
                    ->where(function ($query) {
                        $query->where('estado', 'pendiente')
                            ->orWhere(function ($q) {
                                $q->whereIn('estado', ['aceptada', 'rechazada'])
                                    ->where('fecha_respuesta', '>=', now()->subDay()); // ÚLTIMAS 24 HORAS
                            });
                    })
                    ->exists();

                // Si no existe notificación reciente, crear una nueva
                if (!$existeNotificacion) {
                    Notification::create([
                        'user_id' => $targetUserId,
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
                        'assigned_to_user_id' => $targetUserId
                    ]);
                }
            }
        }
    }
}
