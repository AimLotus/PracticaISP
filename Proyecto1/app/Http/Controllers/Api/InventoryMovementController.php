<?php

namespace App\Http\Controllers\Api;

use App\Models\Inventory;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Carbon;

class InventoryMovementController extends Controller
{
    // Listar todos los movimientos de inventario
    public function index(Request $request)
    {
        $query = InventoryMovement::with('inventory.product')->orderBy('created_at', 'desc');

        // Filtrar por fecha exacta (opcional)
        if ($request->has('fecha') && $request->fecha) {
            $fecha = Carbon::parse($request->input('fecha'))->timezone(config('app.timezone'));
            $inicio = $fecha->copy()->startOfDay();
            $fin = $fecha->copy()->endOfDay();
            $query->whereBetween('created_at', [$inicio, $fin]);
        }

        // Filtro por tipo de movimiento (opcional)
        if ($request->has('tipo') && $request->tipo !== 'todos') {
            $query->where('tipo', $request->input('tipo'));
        }

        $perPage = $request->input('per_page', 10);
        $movimientos = $query->paginate($perPage);

        // Transformar la colección de resultados para agregar datos del producto
        $movimientos->getCollection()->transform(function ($mov) {
            $mov->producto = $mov->inventory && $mov->inventory->product ? [
                'nombre' => $mov->inventory->product->nombre,
                'codigo' => $mov->inventory->product->codigo,
            ] : null;
            $mov->fecha = $mov->created_at;
            $mov->tipo_movimiento = $mov->tipo;
            return $mov;
        });

        return response()->json($movimientos);
    }

    // Crear nuevo movimiento (entrada o salida)
    public function store(Request $request)
    {
        $request->validate([
            'inventory_id' => 'required|exists:inventory,id',
            'tipo' => 'required|in:entrada,salida',
            'cantidad' => 'required|integer|min:1',
            'motivo' => 'nullable|string|max:255',
        ]);

        $inventory = Inventory::findOrFail($request->inventory_id);

        // Actualizar stock según tipo
        if ($request->tipo === 'entrada') {
            $inventory->cantidad += $request->cantidad;
        } else { // salida
            if ($request->cantidad > $inventory->cantidad) {
                return response()->json(['error' => 'No hay suficiente stock para la salida.'], 400);
            }
            $inventory->cantidad -= $request->cantidad;
        }
        $inventory->save();

        // Crear movimiento
        $movimiento = InventoryMovement::create([
            'inventory_id' => $request->inventory_id,
            'tipo' => $request->tipo,
            'cantidad' => $request->cantidad,
            'motivo' => $request->motivo,
        ]);

        return response()->json($movimiento, 201);
    }
}