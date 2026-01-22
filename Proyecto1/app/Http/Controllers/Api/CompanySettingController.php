<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CompanySettingController extends Controller
{
    /**
     * Middleware para verificar que solo admin y dueño puedan acceder
     */
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            $user = $request->user();
            if (!$user) {
                return response()->json(['error' => 'No autenticado'], 401);
            }

            // Obtener el nombre del rol de manera flexible
            $rolNombre = null;
            if (isset($user->rol) && is_object($user->rol)) {
                $rolNombre = $user->rol->nombre;
            } elseif (isset($user->role) && is_object($user->role)) {
                $rolNombre = $user->role->nombre;
            } elseif (isset($user->rol) && is_string($user->rol)) {
                $rolNombre = $user->rol;
            }

            if (!in_array($rolNombre, ['admin', 'dueno'])) {
                return response()->json(['error' => 'No tienes permisos para realizar esta acción'], 403);
            }

            return $next($request);
        })->except(['show']);
    }

    /**
     * Obtener la configuración actual de la empresa
     */
    public function show()
    {
        $settings = CompanySetting::current();

        if (!$settings) {
            $settings = CompanySetting::create([
                'nombre_empresa' => 'Mi Empresa'
            ]);
        }

        return response()->json([
            'id' => $settings->id,
            'nombre_empresa' => $settings->nombre_empresa,
            'nombre_dueno' => $settings->nombre_dueno,
            'logo_path' => $settings->logo_path,
            'logo_url' => $settings->logo_url,
            'ruc' => $settings->ruc,
            'direccion' => $settings->direccion,
            'telefono' => $settings->telefono,
            'email' => $settings->email,
        ]);
    }

    /**
     * Actualizar la configuración de la empresa
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre_empresa' => 'sometimes|string|max:200',
            'nombre_dueno' => 'nullable|string|max:100',
            'ruc' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:200',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $settings = CompanySetting::current();

        if (!$settings) {
            $settings = CompanySetting::create($request->only([
                'nombre_empresa',
                'nombre_dueno',
                'ruc',
                'direccion',
                'telefono',
                'email'
            ]));
        } else {
            $settings->update($request->only([
                'nombre_empresa',
                'nombre_dueno',
                'ruc',
                'direccion',
                'telefono',
                'email'
            ]));
        }

        return response()->json([
            'message' => 'Configuración actualizada exitosamente',
            'settings' => $settings
        ]);
    }

    /**
     * Subir/actualizar el logo de la empresa
     */
    public function uploadLogo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $settings = CompanySetting::current();

        if (!$settings) {
            $settings = CompanySetting::create([
                'nombre_empresa' => 'Mi Empresa'
            ]);
        }

        // Eliminar logo anterior si existe
        if ($settings->logo_path && Storage::disk('public')->exists($settings->logo_path)) {
            Storage::disk('public')->delete($settings->logo_path);
        }

        // Guardar nuevo logo
        $path = $request->file('logo')->store('logos', 'public');
        $settings->update(['logo_path' => $path]);

        return response()->json([
            'message' => 'Logo actualizado exitosamente',
            'logo_path' => $path,
            'logo_url' => $settings->logo_url
        ]);
    }

    /**
     * Eliminar el logo de la empresa
     */
    public function deleteLogo()
    {
        $settings = CompanySetting::current();

        if (!$settings || !$settings->logo_path) {
            return response()->json(['error' => 'No hay logo para eliminar'], 404);
        }

        // Eliminar archivo
        if (Storage::disk('public')->exists($settings->logo_path)) {
            Storage::disk('public')->delete($settings->logo_path);
        }

        $settings->update(['logo_path' => null]);

        return response()->json([
            'message' => 'Logo eliminado exitosamente'
        ]);
    }
}
