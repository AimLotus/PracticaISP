<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Provider;
use Illuminate\Http\Request;

class ProviderController extends Controller
{
    public function index()
    {
        return Provider::all();
    }

    public function store(Request $request)
    {
        // Validación de datos del proveedor
        $request->validate([
            'nombre' => 'required|string|max:255',
            'ruc_ci' => [
                'nullable',
                'string',
                'regex:/^(\d{10}|\d{13})$/',
                'unique:providers,ruc_ci'
            ],
            'email' => 'nullable|email|max:255',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:255',
        ], [
            'ruc_ci.regex' => 'El RUC/Cédula debe tener 10 o 13 dígitos numéricos.',
        ]);

        $proveedor = Provider::create($request->all());

        return response()->json($proveedor, 201);
    }

    public function show(Provider $proveedor)
    {
        return $proveedor;
    }

    public function update(Request $request, Provider $proveedor)
    {
        // Validación de actualización del proveedor
        $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'ruc_ci' => [
                'nullable',
                'string',
                'regex:/^(\d{10}|\d{13})$/',
                'unique:providers,ruc_ci,' . $proveedor->id
            ],
            'email' => 'nullable|email|max:255',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:255',
        ], [
            'ruc_ci.regex' => 'El RUC/Cédula debe tener 10 o 13 dígitos numéricos.',
        ]);

        $proveedor->update($request->all());

        return response()->json($proveedor);
    }

    public function destroy(Provider $proveedor)
    {
        $proveedor->delete();

        return response()->json(null, 204);
    }

    public function countProviders(Request $request)
{
    try {
        $total = Provider::count();
        
        return response()->json([
            'success' => true,
            'totalProveedores' => $total
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al contar proveedores'
        ], 500);
    }
}
}