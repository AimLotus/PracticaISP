<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index()
    {
        return Client::all();
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'nombre' => ['required', 'string', 'max:255'],
                'ruc_ci' => ['nullable', 'string', 'regex:/^\d{10}$|^\d{13}$/', 'unique:clients,ruc_ci'],
                'email' => ['nullable', 'email', 'max:255'],
                'telefono' => ['nullable', 'string', 'max:20'],
                'direccion' => ['nullable', 'string', 'max:255'],
            ], [
                'ruc_ci.regex' => 'El RUC/Cédula debe tener 10 o 13 dígitos numéricos.',
                'ruc_ci.unique' => 'El RUC/Cédula ya está registrado.',
            ]);

            $cliente = Client::create($request->all());

            return response()->json($cliente, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error creando cliente: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno al crear cliente: ' . $e->getMessage()], 500);
        }
    }

    public function show(Client $cliente)
    {
        return $cliente;
    }

    public function update(Request $request, Client $cliente)
    {
        $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'max:255'],
            'ruc_ci' => ['nullable', 'string', 'regex:/^\d{10}$|^\d{13}$/', 'unique:clients,ruc_ci,' . $cliente->id],
            'email' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'direccion' => ['nullable', 'string', 'max:255'],
        ], [
            'ruc_ci.regex' => 'El RUC/Cédula debe tener 10 o 13 dígitos numéricos.',
        ]);

        $cliente->update($request->all());

        return response()->json($cliente);
    }

    public function destroy(Client $cliente)
    {
        $cliente->delete();

        return response()->json(null, 204);
    }

    public function count()
    {
        $totalClientes = \App\Models\Client::count();

        return response()->json([
            'totalClientes' => $totalClientes,
        ]);
    }

}