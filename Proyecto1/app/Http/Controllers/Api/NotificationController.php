<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Mail\LowStockNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    /**
     * Obtener notificaciones del usuario autenticado (solo dueños y admins)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Verificar que el usuario sea dueño/admin
        $roleName = $user->rol ? $user->rol->nombre : null;
        if (!in_array($roleName, ['admin', 'dueno'])) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado'
            ], 403);
        }

        $notifications = Notification::with(['product', 'provider'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'producto' => [
                        'id' => $notification->product->id,
                        'nombre' => $notification->product->nombre,
                        'codigo' => $notification->product->codigo,
                    ],
                    'proveedor' => $notification->provider ? [
                        'id' => $notification->provider->id,
                        'nombre' => $notification->provider->nombre,
                        'email' => $notification->provider->email,
                    ] : null,
                    'tipo' => $notification->tipo,
                    'mensaje' => $notification->mensaje,
                    'cantidad_actual' => $notification->cantidad_actual,
                    'stock_minimo' => $notification->stock_minimo,
                    'estado' => $notification->estado,
                    'leida' => $notification->leida,
                    'fecha_respuesta' => $notification->fecha_respuesta,
                    'created_at' => $notification->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'notifications' => $notifications
        ], 200);
    }

    /**
     * Obtener conteo de notificaciones no leídas
     */
    public function unreadCount(Request $request)
    {
        $user = $request->user();
        
        $roleName = $user->rol ? $user->rol->nombre : null;
        if (!in_array($roleName, ['admin', 'dueno'])) {
            return response()->json(['count' => 0]);
        }

        $count = Notification::where('user_id', $user->id)
            ->where('leida', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Marcar notificación como leída
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada'
            ], 404);
        }

        $notification->leida = true;
        $notification->save();

        return response()->json([
            'success' => true,
            'message' => 'Notificación marcada como leída'
        ], 200);
    }

    /**
     * Marcar todas las notificaciones como leídas
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        
        Notification::where('user_id', $user->id)
            ->where('leida', false)
            ->update(['leida' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Todas las notificaciones marcadas como leídas'
        ], 200);
    }

    /**
     * Aceptar notificación y enviar correo al proveedor
     */
    public function accept(Request $request, $id)
    {
        $user = $request->user();
        
        $notification = Notification::with(['product', 'provider'])
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada'
            ], 404);
        }

        if ($notification->estado !== 'pendiente') {
            return response()->json([
                'success' => false,
                'message' => 'Esta notificación ya ha sido procesada'
            ], 400);
        }

        // Obtener el proveedor_id del request o usar el de la notificación
        $providerId = $request->input('proveedor_id', $notification->provider_id);
        
        if (!$providerId) {
            return response()->json([
                'success' => false,
                'message' => 'Debe seleccionar un proveedor'
            ], 400);
        }

        // Cargar el proveedor seleccionado
        $provider = \App\Models\Provider::find($providerId);
        
        if (!$provider || !$provider->email) {
            return response()->json([
                'success' => false,
                'message' => 'El proveedor seleccionado no tiene correo electrónico configurado'
            ], 400);
        }

        try {
            // Enviar correo al proveedor seleccionado
            Mail::to($provider->email)->send(
                new LowStockNotification(
                    $notification->product,
                    $provider,
                    $notification->cantidad_actual,
                    $notification->stock_minimo
                )
            );

            // Actualizar estado de la notificación y el proveedor usado
            $notification->provider_id = $providerId;
            $notification->estado = 'aceptada';
            $notification->leida = true;
            $notification->fecha_respuesta = now();
            $notification->save();

            Log::info('Email de stock bajo enviado por aceptación manual', [
                'notification_id' => $notification->id,
                'producto' => $notification->product->nombre,
                'proveedor' => $provider->nombre,
                'proveedor_email' => $provider->email,
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Correo enviado exitosamente a ' . $provider->nombre
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error al enviar email de notificación', [
                'notification_id' => $notification->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al enviar el correo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rechazar notificación
     */
    public function reject(Request $request, $id)
    {
        $user = $request->user();
        
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada'
            ], 404);
        }

        if ($notification->estado !== 'pendiente') {
            return response()->json([
                'success' => false,
                'message' => 'Esta notificación ya ha sido procesada'
            ], 400);
        }

        $notification->estado = 'rechazada';
        $notification->leida = true;
        $notification->fecha_respuesta = now();
        $notification->save();

        Log::info('Notificación de stock bajo rechazada', [
            'notification_id' => $notification->id,
            'producto' => $notification->product->nombre,
            'user_id' => $user->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notificación rechazada'
        ], 200);
    }
}
