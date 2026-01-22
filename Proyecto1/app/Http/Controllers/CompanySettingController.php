<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CompanySettingController extends Controller
{
    /**
     * Verificar que el usuario tenga rol de admin o dueño
     */
    private function verificarPermiso()
    {
        $user = auth()->user();

        if (!$user) {
            \Log::warning('Intento de acceso sin autenticación');
            return response()->json(['error' => 'No autenticado'], 401);
        }

        // Cargar explícitamente la relación del rol si no está cargada
        if (!$user->relationLoaded('rol')) {
            $user->load('rol');
        }

        // Manejo flexible del rol del usuario
        $rolNombre = null;

        // Intentar obtener el nombre del rol de diferentes formas
        if ($user->rol && is_object($user->rol)) {
            $rolNombre = $user->rol->nombre;
        } elseif (isset($user->role) && is_object($user->role)) {
            $rolNombre = $user->role->nombre;
        } elseif (isset($user->rol_id)) {
            // Si no se cargó la relación, buscar el rol directamente
            $rol = \App\Models\Role::find($user->rol_id);
            $rolNombre = $rol ? $rol->nombre : null;
        }

        \Log::info('Verificación de permiso', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'rol_nombre' => $rolNombre,
            'rol_loaded' => $user->relationLoaded('rol')
        ]);

        if (!$rolNombre) {
            \Log::error('No se pudo determinar el rol del usuario', [
                'user_id' => $user->id,
                'user_email' => $user->email
            ]);
            return response()->json([
                'error' => 'No se pudo verificar el rol del usuario',
                'message' => 'Por favor contacte al administrador'
            ], 500);
        }

        if (!in_array($rolNombre, ['admin', 'dueno'])) {
            \Log::warning('Usuario sin permisos intentó acceder', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'rol_nombre' => $rolNombre
            ]);
            return response()->json([
                'error' => 'No autorizado',
                'message' => 'Solo usuarios con rol admin o dueño pueden realizar esta acción'
            ], 403);
        }

        return null; // Sin error
    }

    /**
     * Obtener la configuración de la empresa
     */
    public function getConfig()
    {
        // Permitir a todos los usuarios autenticados ver la configuración
        // Solo verificar que esté autenticado
        if (!auth()->check()) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        try {
            $config = CompanySetting::first();

            if (!$config) {
                // Si no existe configuración, crear una por defecto
                $config = CompanySetting::create([
                    'nombre_empresa' => 'Mi Empresa',
                    'ruc' => '',
                    'direccion' => '',
                    'telefono' => '',
                    'email' => '',
                    'logo_path' => null
                ]);
            }

            // Agregar la URL del logo
            $configData = $config->toArray();
            $configData['logo_url'] = $config->logo_url;

            return response()->json([
                'success' => true,
                'data' => $configData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener configuración',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar la configuración de la empresa
     */
    public function updateConfig(Request $request)
    {
        $error = $this->verificarPermiso();
        if ($error)
            return $error;

        try {
            $validator = Validator::make($request->all(), [
                'nombre_empresa' => 'required|string|max:255',
                'nombre_dueno' => 'nullable|string|max:100',
                'ruc' => 'nullable|string|max:20',
                'direccion' => 'nullable|string|max:500',
                'telefono' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $config = CompanySetting::first();

            if (!$config) {
                $config = new CompanySetting();
            }

            $config->fill($request->only([
                'nombre_empresa',
                'nombre_dueno',
                'ruc',
                'direccion',
                'telefono',
                'email'
            ]));

            $config->save();

            return response()->json([
                'success' => true,
                'message' => 'Configuración actualizada correctamente',
                'data' => $config,
                'shouldReload' => true  // Indicador para recargar la página
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar configuración',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Redimensionar imagen usando GD
     */
    private function resizeImage($sourcePath, $destinationPath, $maxWidth = 300, $maxHeight = 300)
    {
        // Obtener información de la imagen original
        list($origWidth, $origHeight, $imageType) = getimagesize($sourcePath);

        // Calcular nuevas dimensiones manteniendo el aspect ratio
        $ratio = min($maxWidth / $origWidth, $maxHeight / $origHeight);
        $newWidth = round($origWidth * $ratio);
        $newHeight = round($origHeight * $ratio);

        // Crear imagen desde el archivo original según su tipo
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                $sourceImage = imagecreatefromjpeg($sourcePath);
                break;
            case IMAGETYPE_PNG:
                $sourceImage = imagecreatefrompng($sourcePath);
                break;
            case IMAGETYPE_GIF:
                $sourceImage = imagecreatefromgif($sourcePath);
                break;
            default:
                return false;
        }

        // Crear imagen de destino
        $destImage = imagecreatetruecolor($newWidth, $newHeight);

        // Preservar transparencia para PNG y GIF
        if ($imageType == IMAGETYPE_PNG || $imageType == IMAGETYPE_GIF) {
            imagealphablending($destImage, false);
            imagesavealpha($destImage, true);
            $transparent = imagecolorallocatealpha($destImage, 255, 255, 255, 127);
            imagefilledrectangle($destImage, 0, 0, $newWidth, $newHeight, $transparent);
        }

        // Redimensionar
        imagecopyresampled($destImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);

        // Guardar según el tipo
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                imagejpeg($destImage, $destinationPath, 90);
                break;
            case IMAGETYPE_PNG:
                imagepng($destImage, $destinationPath, 8);
                break;
            case IMAGETYPE_GIF:
                imagegif($destImage, $destinationPath);
                break;
        }

        // Liberar memoria
        imagedestroy($sourceImage);
        imagedestroy($destImage);

        return true;
    }

    /**
     * Subir el logo de la empresa (con redimensionamiento)
     */
    public function uploadLogo(Request $request)
    {
        try {


            $error = $this->verificarPermiso();
            if ($error) {
                \Log::warning('Permiso denegado en uploadLogo');
                return $error;
            }



            // Log para debugging


            if (!$request->hasFile('logo')) {
                \Log::error('No se recibió archivo');
                return response()->json([
                    'success' => false,
                    'message' => 'No se recibió ningún archivo',
                    'debug' => [
                        'all_data' => array_keys($request->all()),
                        'all_files' => array_keys($request->allFiles())
                    ]
                ], 422);
            }

            $file = $request->file('logo');

            if (!$file->isValid()) {
                \Log::error('Archivo no válido', [
                    'error' => $file->getErrorMessage()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo no válido: ' . $file->getErrorMessage()
                ], 422);
            }

            $validator = Validator::make($request->all(), [
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120' // Max 5MB (sin SVG)
            ]);

            if ($validator->fails()) {
                \Log::error('Validación fallida', [
                    'errors' => $validator->errors()->toArray(),
                    'file_mime' => $file->getMimeType(),
                    'file_size' => $file->getSize()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors(),
                    'debug' => [
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(),
                        'extension' => $file->getClientOriginalExtension()
                    ]
                ], 422);
            }

            $config = CompanySetting::first();

            if (!$config) {
                $config = CompanySetting::create([
                    'nombre_empresa' => 'Mi Empresa',
                    'ruc' => '',
                    'direccion' => '',
                    'telefono' => '',
                    'email' => ''
                ]);
            }

            // Eliminar logo anterior si existe
            if ($config->logo_path && Storage::disk('public')->exists($config->logo_path)) {
                Storage::disk('public')->delete($config->logo_path);
            }

            // Procesar y redimensionar la imagen
            $file = $request->file('logo');
            $extension = $file->getClientOriginalExtension();
            $filename = 'logo_' . time() . '.' . $extension;
            $path = 'logos/' . $filename;

            // Crear directorio si no existe
            $fullPath = storage_path('app/public/logos');
            if (!file_exists($fullPath)) {
                mkdir($fullPath, 0755, true);
            }

            // Verificar si GD está disponible para redimensionar
            if (extension_loaded('gd')) {


                // Guardar temporalmente el archivo original
                $tempPath = $file->getRealPath();
                $finalPath = storage_path('app/public/' . $path);

                try {
                    // Redimensionar la imagen
                    $resized = $this->resizeImage($tempPath, $finalPath, 300, 300);

                    if (!$resized) {
                        // Si falla el redimensionamiento, guardar la original con Storage
                        \Log::warning('Redimensionamiento falló, guardando original');
                        $path = $file->store('logos', 'public');
                    } else {

                    }
                } catch (\Exception $e) {
                    // Si hay error en el redimensionamiento, guardar la original con Storage
                    \Log::warning('Error al redimensionar imagen: ' . $e->getMessage());
                    $path = $file->store('logos', 'public');
                }
            } else {
                \Log::warning('Extensión GD no disponible, guardando imagen original con Storage');
                // Guardar directamente usando Laravel Storage (maneja permisos automáticamente)
                $path = $file->store('logos', 'public');
            }

            // Guardar path en la base de datos
            $config->logo_path = $path;
            $config->save();

            // Preparar respuesta con URL completa
            $configData = $config->toArray();
            $configData['logo_url'] = $config->logo_url;

            \Log::info('Logo subido exitosamente');

            return response()->json([
                'success' => true,
                'message' => 'Logo subido y optimizado correctamente',
                'data' => $configData
            ]);

        } catch (\Exception $e) {
            \Log::error('ERROR CRÍTICO en uploadLogo', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al subir logo: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'debug' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 500);
        }
    }

    /**
     * Eliminar el logo de la empresa
     */
    public function deleteLogo()
    {
        $error = $this->verificarPermiso();
        if ($error)
            return $error;

        try {
            $config = CompanySetting::first();

            if (!$config || !$config->logo_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay logo para eliminar'
                ], 404);
            }

            // Eliminar archivo del storage
            if (Storage::disk('public')->exists($config->logo_path)) {
                Storage::disk('public')->delete($config->logo_path);
            }

            $config->logo_path = null;
            $config->save();

            return response()->json([
                'success' => true,
                'message' => 'Logo eliminado correctamente',
                'data' => $config
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar logo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
