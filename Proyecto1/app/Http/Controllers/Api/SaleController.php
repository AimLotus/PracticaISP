<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class SaleController extends Controller
{
    protected $inventoryService;

    public function __construct(\App\Services\InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }
    public function index(Request $request)
    {
        $query = Sale::with('client', 'items.product', 'user')->orderBy('id', 'desc');

        if ($request->has('start_date')) {
            $query->whereDate('fecha', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('fecha', '<=', $request->end_date);
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'productos' => 'required|array|min:1',
            'productos.*.product_id' => 'required|exists:products,id',
            'productos.*.cantidad' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();

        try {
            $subtotal = 0;
            $impuestoTotal = 0;

            // Generar número de factura
            $numeroFactura = 'FAC-' . now()->format('Ymd') . '-' . str_pad(Sale::count() + 1, 4, '0', STR_PAD_LEFT);

            $sale = Sale::create([
                'client_id' => $request->client_id,
                'user_id' => auth()->id(),
                'subtotal' => 0,
                'impuesto' => 0,
                'total' => 0,
                'fecha' => now(),
                'numero_factura' => $numeroFactura,
            ]);

            foreach ($request->productos as $item) {
                $product = Product::with('tax')->findOrFail($item['product_id']);
                $precioVenta = $product->precio_venta;
                $impuestoProducto = optional($product->tax)->porcentaje ?? 0;

                $inventory = Inventory::where('product_id', $product->id)->lockForUpdate()->first();

                if (!$inventory || $inventory->cantidad < $item['cantidad']) {
                    DB::rollBack();
                    return response()->json(['error' => 'Stock insuficiente o producto sin inventario: ID ' . $product->id], 400);
                }

                $productoSubtotal = $item['cantidad'] * $precioVenta;
                $productoImpuesto = $productoSubtotal * ($impuestoProducto / 100);

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $precioVenta,
                    'subtotal' => $productoSubtotal,
                ]);

                $subtotal += $productoSubtotal;
                $impuestoTotal += $productoImpuesto;

                $inventory->cantidad -= $item['cantidad'];
                $inventory->save();

                InventoryMovement::create([
                    'inventory_id' => $inventory->id,
                    'tipo' => 'salida',
                    'cantidad' => $item['cantidad'],
                    'motivo' => 'Venta #' . $sale->id,
                ]);
            }

            $total = $subtotal + $impuestoTotal;

            $sale->subtotal = $subtotal;
            $sale->impuesto = $impuestoTotal;
            $sale->total = $total;
            $sale->save();

            // Generar la factura automáticamente
            $venta = Sale::with(['client', 'user', 'items.product'])->findOrFail($sale->id);
            $pdf = Pdf::loadView('pdf.factura_venta', compact('venta'));

            $filename = 'factura_venta_' . $venta->id . '.pdf';
            $ruta = storage_path('app/public/' . $filename);

            // Eliminar archivo existente si existe
            if (file_exists($ruta)) {
                unlink($ruta);
            }

            $pdf->save($ruta);

            DB::commit();

            // Verificar notificaciones de stock bajo asíncronamente (o síncrona por ahora)
            try {
                $this->inventoryService->checkAndCreateNotifications();
            } catch (\Exception $e) {
                Log::error("Error al verificar stock post-venta: " . $e->getMessage());
            }

            return response()->json([
                'mensaje' => 'Venta registrada y factura generada con éxito',
                'venta' => $venta,
                'factura_url' => asset('storage/' . $filename)
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al registrar la venta: ' . $e->getMessage()], 500);
        }
    }

    public function show(Sale $venta)
    {
        $venta->load('client', 'items.product', 'user');
        return $venta;
    }

    public function update(Request $request, Sale $venta)
    {
        return response()->json(['mensaje' => 'No implementado'], 501);
    }

    public function destroy(Sale $venta)
    {
        DB::beginTransaction();

        try {
            foreach ($venta->items as $item) {
                $inventory = Inventory::where('product_id', $item->product_id)->lockForUpdate()->first();

                if ($inventory) {
                    $inventory->cantidad += $item->cantidad;
                    $inventory->save();

                    InventoryMovement::create([
                        'inventory_id' => $inventory->id,
                        'tipo' => 'entrada',
                        'cantidad' => $item->cantidad,
                        'motivo' => 'Reversión venta #' . $venta->id,
                    ]);
                }
            }

            $venta->delete();

            DB::commit();

            return response()->json(['mensaje' => 'Venta eliminada y stock revertido'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al eliminar la venta: ' . $e->getMessage()], 500);
        }
    }

    public function generarFactura($id)
    {
        $venta = Sale::with(['client', 'user', 'items.product'])->findOrFail($id);

        $pdf = Pdf::loadView('pdf.factura_venta', compact('venta'));

        $filename = 'factura_venta_' . $venta->id . '.pdf';
        $ruta = storage_path('app/public/' . $filename);

        // Eliminar archivo existente si existe
        if (file_exists($ruta)) {
            unlink($ruta);
        }

        $pdf->save($ruta);

        return response()->json([
            'mensaje' => 'Factura generada con éxito',
            'url' => asset('storage/' . $filename)
        ]);
    }

    public function stats()
    {
        $hoy = now()->toDateString();
        $mes = now()->month;

        $ingresosHoy = (float) Sale::whereDate('fecha', $hoy)->sum('total');
        $ingresosMes = (float) Sale::whereMonth('fecha', $mes)->sum('total');
        $totalVentas = (int) Sale::count();

        return response()->json([
            'ingresosHoy' => $ingresosHoy,
            'ingresosMes' => $ingresosMes,
            'totalVentas' => $totalVentas,
        ]);
    }

}