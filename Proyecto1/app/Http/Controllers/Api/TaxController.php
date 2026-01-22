<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tax;
use Illuminate\Support\Facades\Validator;

class TaxController extends Controller
{
    // Listar todos los impuestos
    public function index()
    {
        return Tax::all();
    }

    // Mostrar un impuesto
    public function show(Tax $tax)
    {
        return $tax;
    }

    // Crear un impuesto
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255|unique:taxes,nombre',
            'porcentaje' => 'required|numeric|min:0|max:100',
            'activo' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tax = Tax::create([
            'nombre' => $request->nombre,
            'porcentaje' => $request->porcentaje,
            'activo' => $request->activo ?? true,
        ]);

        return response()->json($tax, 201);
    }

    // Actualizar un impuesto
    public function update(Request $request, Tax $tax)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255|unique:taxes,nombre,' . $tax->id,
            'porcentaje' => 'sometimes|required|numeric|min:0|max:100',
            'activo' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tax->update($request->only(['nombre', 'porcentaje', 'activo']));

        return response()->json($tax);
    }

    // Eliminar un impuesto
    public function destroy(Tax $tax)
    {
        $tax->delete();
        return response()->json(null, 204);
    }

    // Activar o desactivar impuesto
    public function toggleActivo(Tax $tax)
    {
        $tax->activo = !$tax->activo;
        $tax->save();

        return response()->json([
            'message' => $tax->activo ? 'Impuesto activado' : 'Impuesto desactivado',
            'tax' => $tax,
        ]);
    }
}
