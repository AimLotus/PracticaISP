<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class PurchaseController extends Controller
{
    public function index()
    {
        return Purchase::with('provider', 'items.product', 'user')->orderBy('id', 'desc')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'provider_id' => 'required|exists:providers,id',
            'productos' => 'required|array|min:1',
            'productos.*.product_id' => 'required|exists:products,id',
            'productos.*.cantidad' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();

        try {
            $subtotal = 0;
            $impuestoTotal = 0;

            // Guardar la compra y usuario autenticado
            $purchase = Purchase::create([
                'provider_id' => $request->provider_id,
                'subtotal' => 0,
                'impuesto' => 0,
                'total' => 0,
                'fecha' => now(),
                'user_id' => auth()->id(), // <= Usuario autenticado
            ]);

            foreach ($request->productos as $item) {
                $product = Product::with('tax')->findOrFail($item['product_id']);
                $precioCompra = $product->precio_compra;
                $porcentajeImpuesto = optional($product->tax)->porcentaje ?? 0;

                $productoSubtotal = $item['cantidad'] * $precioCompra;
                $productoImpuesto = $productoSubtotal * ($porcentajeImpuesto / 100);

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'cantidad' => $item['cantidad'],
                    'precio_compra' => $precioCompra,
                    'subtotal' => $productoSubtotal,
                ]);

                $subtotal += $productoSubtotal;
                $impuestoTotal += $productoImpuesto;

                // Actualizar o crear inventario
                $inventory = Inventory::firstOrCreate(
                    ['product_id' => $product->id],
                    ['cantidad' => 0]
                );

                $inventory->cantidad += $item['cantidad'];
                $inventory->save();

                // Movimiento de entrada
                InventoryMovement::create([
                    'inventory_id' => $inventory->id,
                    'tipo' => 'entrada',
                    'cantidad' => $item['cantidad'],
                    'motivo' => 'Compra #' . $purchase->id,
                ]);
            }

            $purchase->update([
                'subtotal' => $subtotal,
                'impuesto' => $impuestoTotal,
                'total' => $subtotal + $impuestoTotal,
            ]);

            DB::commit();

            $pdf = Pdf::loadView('pdf.reporte_compra', ['compra' => $purchase->load('provider', 'items.product', 'user')]);
            $filename = 'reporte_compra_' . $purchase->id . '.pdf';
            $ruta = storage_path('app/public/' . $filename);
            
            // Eliminar archivo existente si existe
            if (file_exists($ruta)) {
                unlink($ruta);
            }
            
            $pdf->save($ruta);

            return response()->json([
                'mensaje' => 'Compra registrada con éxito',
                'url_reporte' => asset('storage/' . $filename),
                'compra' => $purchase->load('provider', 'items.product', 'user')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar compra: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'error' => 'Error al registrar la compra: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Purchase $purchase)
    {
        return $purchase->load('provider', 'items.product', 'user');
    }

    public function update(Request $request, Purchase $purchase)
    {
        return response()->json(['mensaje' => 'No implementado'], 501);
    }

    public function destroy(Purchase $purchase)
    {
        DB::beginTransaction();

        try {
            foreach ($purchase->items as $item) {
                $inventory = Inventory::where('product_id', $item->product_id)->lockForUpdate()->first();
                if ($inventory) {
                    $inventory->cantidad -= $item->cantidad;
                    if ($inventory->cantidad < 0) $inventory->cantidad = 0;
                    $inventory->save();

                    InventoryMovement::create([
                        'inventory_id' => $inventory->id,
                        'tipo' => 'salida',
                        'cantidad' => $item->cantidad,
                        'motivo' => 'Reversión compra #' . $purchase->id,
                    ]);
                }
            }

            $purchase->delete();

            DB::commit();
            return response()->json(['mensaje' => 'Compra eliminada y stock revertido'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al eliminar compra: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json(['error' => 'Error al eliminar la compra: ' . $e->getMessage()], 500);
        }
    }

    public function generarReporte($id)
{
    $compra = Purchase::with(['provider', 'user', 'items.product'])->findOrFail($id);

    $pdf = Pdf::loadView('pdf.reporte_compra', compact('compra'));

    $filename = 'reporte_compra_' . $compra->id . '.pdf';
    $path = storage_path('app/public/' . $filename);

    // Eliminar archivo existente si existe
    if (file_exists($path)) {
        unlink($path);
    }

    $pdf->save($path);

    return response()->json([
        'mensaje' => 'Reporte generado correctamente',
        'url' => asset('storage/' . $filename),
    ]);
}

public function getPurchaseStats(Request $request)
{
    try {
        $today = now()->format('Y-m-d');
        $monthStart = now()->startOfMonth()->format('Y-m-d');
        $monthEnd = now()->endOfMonth()->format('Y-m-d');

        $stats = [
            'success' => true,
            'hoy' => Purchase::whereDate('fecha', $today)->sum('total') ?? 0,
            'mes' => Purchase::whereBetween('fecha', [$monthStart, $monthEnd])->sum('total') ?? 0,
            'total' => Purchase::count()
        ];

        return response()->json($stats);

    } catch (\Exception $e) {
        \Log::error("Error en getPurchaseStats: " . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Error al obtener estadísticas',
            'error' => env('APP_DEBUG') ? $e->getMessage() : null
        ], 500);
    }
}
}