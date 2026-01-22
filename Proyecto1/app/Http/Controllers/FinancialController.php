<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinancialController extends Controller
{
    /**
     * Verificar que el usuario tenga rol de admin o dueño
     */
    private function verificarPermiso()
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        // Manejo flexible del rol del usuario
        $rolNombre = null;
        
        if (isset($user->rol) && is_object($user->rol)) {
            $rolNombre = $user->rol->nombre;
        } elseif (isset($user->role) && is_object($user->role)) {
            $rolNombre = $user->role->nombre;
        } elseif (isset($user->rol) && is_string($user->rol)) {
            $rolNombre = $user->rol;
        }

        if (!in_array($rolNombre, ['admin', 'dueno'])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        return null; // Sin error
    }

    /**
     * Obtener resumen financiero general
     */
    public function getResumen(Request $request)
    {
        $error = $this->verificarPermiso();
        if ($error) return $error;
        
        try {
            // Obtener filtros de fecha
            $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
            $fechaFin = $request->input('fecha_fin', Carbon::now()->format('Y-m-d'));

            // Total de ventas en el período
            $totalVentas = Sale::whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->sum('total');

            // Total de compras en el período
            $totalCompras = Purchase::whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->sum('total');

            // Ganancia (ventas - compras)
            $ganancia = $totalVentas - $totalCompras;

            // Valor total del inventario
            $valorInventario = DB::table('inventories')
                ->join('products', 'inventories.product_id', '=', 'products.id')
                ->sum(DB::raw('inventories.cantidad * products.precio_venta'));

            // Productos con stock bajo (menos de 10 unidades)
            $productosBajoStock = DB::table('products')
                ->join('inventories', 'products.id', '=', 'inventories.product_id')
                ->where('inventories.cantidad', '<', 10)
                ->count();

            // Número de ventas
            $numeroVentas = Sale::whereBetween('created_at', [$fechaInicio, $fechaFin])->count();

            // Número de compras
            $numeroCompras = Purchase::whereBetween('created_at', [$fechaInicio, $fechaFin])->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_ventas' => round($totalVentas, 2),
                    'total_compras' => round($totalCompras, 2),
                    'ganancia' => round($ganancia, 2),
                    'valor_inventario' => round($valorInventario, 2),
                    'productos_bajo_stock' => $productosBajoStock,
                    'numero_ventas' => $numeroVentas,
                    'numero_compras' => $numeroCompras,
                    'periodo' => [
                        'inicio' => $fechaInicio,
                        'fin' => $fechaFin
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener resumen financiero',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener ventas por período (para gráficos de tendencias)
     */
    public function getVentasPorPeriodo(Request $request)
    {
        $error = $this->verificarPermiso();
        if ($error) return $error;
        
        try {
            $periodo = $request->input('periodo', 'mes'); // mes, semana, año
            $fechaInicio = $request->input('fecha_inicio');
            $fechaFin = $request->input('fecha_fin');

            if (!$fechaInicio) {
                $fechaInicio = Carbon::now()->startOfMonth()->format('Y-m-d');
            }
            if (!$fechaFin) {
                $fechaFin = Carbon::now()->format('Y-m-d');
            }

            $query = Sale::whereBetween('created_at', [$fechaInicio, $fechaFin]);

            $groupBy = match($periodo) {
                'dia' => DB::raw('DATE(created_at)'),
                'semana' => DB::raw('YEARWEEK(created_at)'),
                'mes' => DB::raw('DATE_FORMAT(created_at, "%Y-%m")'),
                'año' => DB::raw('YEAR(created_at)'),
                default => DB::raw('DATE(created_at)')
            };

            $ventas = $query->select(
                    DB::raw('DATE(created_at) as fecha'),
                    DB::raw('SUM(total) as total'),
                    DB::raw('COUNT(*) as cantidad')
                )
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $ventas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener ventas por período',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Comparación de ventas vs compras
     */
    public function getComparacion(Request $request)
    {
        $error = $this->verificarPermiso();
        if ($error) return $error;
        
        try {
            $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
            $fechaFin = $request->input('fecha_fin', Carbon::now()->format('Y-m-d'));

            $ventas = Sale::whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->select(
                    DB::raw('DATE(created_at) as fecha'),
                    DB::raw('SUM(total) as total')
                )
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('created_at')
                ->get();

            $compras = Purchase::whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->select(
                    DB::raw('DATE(created_at) as fecha'),
                    DB::raw('SUM(total) as total')
                )
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'ventas' => $ventas,
                    'compras' => $compras
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener comparación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener productos más vendidos
     */
    public function getProductosMasVendidos(Request $request)
    {
        $error = $this->verificarPermiso();
        if ($error) return $error;
        
        try {
            $limit = $request->input('limit', 5);
            $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
            $fechaFin = $request->input('fecha_fin', Carbon::now()->format('Y-m-d'));

            $productos = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->whereBetween('sales.created_at', [$fechaInicio, $fechaFin])
                ->select(
                    'products.id',
                    'products.nombre',
                    DB::raw('SUM(sale_items.cantidad) as cantidad_vendida'),
                    DB::raw('SUM(sale_items.subtotal) as total_vendido')
                )
                ->groupBy('products.id', 'products.nombre')
                ->orderByDesc('cantidad_vendida')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $productos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener productos más vendidos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Estadísticas de inventario
     */
    public function getInventarioStats()
    {
        $error = $this->verificarPermiso();
        if ($error) return $error;
        
        try {
            $totalProductos = Product::count();
            
            $valorTotal = DB::table('inventories')
                ->join('products', 'inventories.product_id', '=', 'products.id')
                ->sum(DB::raw('inventories.cantidad * products.precio_venta'));
            
            $productosBajoStock = DB::table('products')
                ->join('inventories', 'products.id', '=', 'inventories.product_id')
                ->where('inventories.cantidad', '<', 10)
                ->count();
                
            $productosAgotados = DB::table('products')
                ->join('inventories', 'products.id', '=', 'inventories.product_id')
                ->where('inventories.cantidad', '=', 0)
                ->count();
            
            // Productos por categoría (si existe la relación)
            $productosPorCategoria = Product::select('codigo', DB::raw('count(*) as total'))
                ->groupBy('codigo')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_productos' => $totalProductos,
                    'valor_total' => round($valorTotal, 2),
                    'bajo_stock' => $productosBajoStock,
                    'agotados' => $productosAgotados,
                    'por_categoria' => $productosPorCategoria
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas de inventario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener reporte de flujo de caja
     */
    public function getFlujoCaja(Request $request)
    {
        $error = $this->verificarPermiso();
        if ($error) return $error;
        
        try {
            $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
            $fechaFin = $request->input('fecha_fin', Carbon::now()->format('Y-m-d'));

            $ingresos = Sale::whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->select(
                    DB::raw('DATE(created_at) as fecha'),
                    DB::raw('SUM(total) as monto'),
                    DB::raw('"ingreso" as tipo')
                )
                ->groupBy(DB::raw('DATE(created_at)'));

            $egresos = Purchase::whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->select(
                    DB::raw('DATE(created_at) as fecha'),
                    DB::raw('SUM(total) as monto'),
                    DB::raw('"egreso" as tipo')
                )
                ->groupBy(DB::raw('DATE(created_at)'));

            $flujoCaja = $ingresos->union($egresos)
                ->orderBy('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $flujoCaja
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener flujo de caja',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
