<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\Role;


class UserController extends Controller
{
    // Mostrar todos los usuarios
    public function index()
    {
        return User::with('rol')->get();
    }

    // Mostrar un solo usuario
    public function show(User $user)
    {
        return $user;
    }

    // Actualizar usuario

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,'.$user->id,
            'password' => 'sometimes|required|string|min:6',
            'rol_id' => 'sometimes|required|integer|exists:roles,id', // valida que exista el rol en la tabla roles
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json($user, 200);
    }


    // Eliminar usuario
    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(null, 204);
    }

    // Crear Usuario

    public function create(Request $request)
{
    $validator = Validator::make($request->all(), [
        'nombre'   => 'required|string|max:255',
        'email'    => 'required|email|unique:users,email',
        'password' => 'required|min:6',
        'rol'      => 'required|string|exists:roles,nombre', // 👈 Nuevo campo
    ]);

    if ($validator->fails()) {
        return response()->json([
            'errors' => $validator->errors()
        ], 422);
    }

    // Buscar el rol por el nombre que se envía (ej: "ventas", "compras")
    $rol = Role::where('nombre', $request->rol)->first();

    if (!$rol) {
        return response()->json([
            'error' => 'El rol especificado no existe.'
        ], 400);
    }

    // Crear el usuario con el rol seleccionado
    $user = User::create([
        'name'     => $request->nombre,
        'email'    => $request->email,
        'password' => Hash::make($request->password),
        'rol_id'   => $rol->id,
    ]);

    return response()->json([
        'message' => 'Usuario registrado correctamente con rol: ' . $rol->nombre,
        'user'    => $user
    ], 201);
}

    // Cambiar estado de usuario
    public function toggleActivo(User $user)
{
    $user->activo = !$user->activo;
    $user->save();

    return response()->json([
        'message' => $user->activo ? 'Usuario activado' : 'Usuario desactivado',
        'user' => $user
    ], 200);
}

}
