<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // Login de usuario
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'No se encontró una cuenta con este correo electrónico.'
            ], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña es incorrecta.'
            ], 401);
        }

        // ❗ Verificar si el usuario está inactivo
        if (!$user->activo) {
            return response()->json([
                'message' => 'Tu cuenta está desactivada. Contacta con un administrador.'
            ], 403);
        }

        // Cargar la relación del rol
        $user->load('role');

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login correcto',
            'token' => $token,
            'user' => $user
        ]);
    }

    // Logout (revoca todos los tokens del usuario)
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente'
        ]);
    }
}