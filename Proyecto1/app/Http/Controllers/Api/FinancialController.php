<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Product;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

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
        if ($error)
            return $error;

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
            $valorInventario = DB::table('inventory')
                ->join('products', 'inventory.product_id', '=', 'products.id')
                ->sum(DB::raw('inventory.cantidad * products.precio_venta'));

            // Productos con stock bajo (menos de 10 unidades)
            $productosBajoStock = DB::table('products')
                ->join('inventory', 'products.id', '=', 'inventory.product_id')
                ->where('inventory.cantidad', '<', 10)
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
        if ($error)
            return $error;

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

            // Detección de driver para compatibilidad SQL
            $connection = config('database.default');
            $driver = config("database.connections.{$connection}.driver");
            $isPgsql = $driver === 'pgsql';

            if ($isPgsql) {
                $groupBy = match ($periodo) {
                    'dia' => DB::raw('created_at::date'),
                    'semana' => DB::raw("TO_CHAR(created_at, 'YYYY-WW')"),
                    'mes' => DB::raw("TO_CHAR(created_at, 'YYYY-MM')"),
                    'año' => DB::raw('EXTRACT(YEAR FROM created_at)'),
                    default => DB::raw('created_at::date')
                };

                $selectDate = match ($periodo) {
                    'dia' => DB::raw('created_at::date as fecha'),
                    'semana' => DB::raw("TO_CHAR(created_at, 'YYYY-WW') as fecha"),
                    'mes' => DB::raw("TO_CHAR(created_at, 'YYYY-MM') as fecha"),
                    'año' => DB::raw('EXTRACT(YEAR FROM created_at) as fecha'),
                    default => DB::raw('created_at::date as fecha')
                };
            } else {
                // Fallback MySQL/MariaDB
                $groupBy = match ($periodo) {
                    'dia' => DB::raw('DATE(created_at)'),
                    'semana' => DB::raw('YEARWEEK(created_at)'),
                    'mes' => DB::raw('DATE_FORMAT(created_at, "%Y-%m")'),
                    'año' => DB::raw('YEAR(created_at)'),
                    default => DB::raw('DATE(created_at)')
                };

                $selectDate = match ($periodo) {
                    'dia' => DB::raw('DATE(created_at) as fecha'),
                    'semana' => DB::raw('YEARWEEK(created_at) as fecha'),
                    'mes' => DB::raw('DATE_FORMAT(created_at, "%Y-%m") as fecha'),
                    'año' => DB::raw('YEAR(created_at) as fecha'),
                    default => DB::raw('DATE(created_at) as fecha')
                };
            }

            $ventas = $query->select(
                $selectDate,
                DB::raw('SUM(total) as total'),
                DB::raw('COUNT(*) as cantidad')
            )
                ->groupBy($groupBy)
                ->orderBy('fecha')
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
        if ($error)
            return $error;

        try {
            $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
            $fechaFin = $request->input('fecha_fin', Carbon::now()->format('Y-m-d'));

            // Detección de driver para compatibilidad SQL
            $connection = config('database.default');
            $driver = config("database.connections.{$connection}.driver");
            $isPgsql = $driver === 'pgsql';

            $rawDate = $isPgsql ? 'created_at::date' : 'DATE(created_at)';

            $ventas = Sale::whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->select(
                    DB::raw("$rawDate as fecha"),
                    DB::raw('SUM(total) as total')
                )
                ->groupBy(DB::raw($rawDate))
                ->orderBy('fecha')
                ->get();

            $compras = Purchase::whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->select(
                    DB::raw("$rawDate as fecha"),
                    DB::raw('SUM(total) as total')
                )
                ->groupBy(DB::raw($rawDate))
                ->orderBy('fecha')
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
        if ($error)
            return $error;

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
     * Obtener ventas por categoría
     */
    public function getVentasPorCategoria(Request $request)
    {
        $error = $this->verificarPermiso();
        if ($error)
            return $error;

        try {
            $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
            $fechaFin = $request->input('fecha_fin', Carbon::now()->format('Y-m-d'));

            $categorias = DB::table('sale_items')
                ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
                ->join('products', 'products.id', '=', 'sale_items.product_id')
                ->whereBetween('sales.created_at', [$fechaInicio, $fechaFin])
                ->select(
                    'products.categoria',
                    DB::raw('SUM(sale_items.subtotal) as ventas')
                )
                ->groupBy('products.categoria')
                ->orderByDesc('ventas')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $categorias
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener ventas por categoría',
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
        if ($error)
            return $error;

        try {
            $totalProductos = Product::count();

            $valorTotal = DB::table('inventory')
                ->join('products', 'inventory.product_id', '=', 'products.id')
                ->sum(DB::raw('inventory.cantidad * products.precio_venta'));

            $productosBajoStock = DB::table('products')
                ->join('inventory', 'products.id', '=', 'inventory.product_id')
                ->where('inventory.cantidad', '<', 10)
                ->count();

            $productosAgotados = DB::table('products')
                ->join('inventory', 'products.id', '=', 'inventory.product_id')
                ->where('inventory.cantidad', '=', 0)
                ->count();

            // Productos por categoría (si existe la relación)
            // Se asume PostgreSQL para la agrupación
            $connection = config('database.default');
            $driver = config("database.connections.{$connection}.driver");
            $isPgsql = $driver === 'pgsql';

            // Para Postgres es necesario agregar categoria al group by si se selecciona
            // Aquí seleccionamos codigo, así que agrupamos por codigo
            $productosPorCategoria = Product::select('categoria', DB::raw('count(*) as total'))
                ->groupBy('categoria')
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
        if ($error)
            return $error;

        try {
            $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
            $fechaFin = $request->input('fecha_fin', Carbon::now()->format('Y-m-d'));

            // Detección de driver para compatibilidad SQL
            $connection = config('database.default');
            $driver = config("database.connections.{$connection}.driver");
            $isPgsql = $driver === 'pgsql';
            $rawDate = $isPgsql ? 'created_at::date' : 'DATE(created_at)';

            $ingresos = Sale::whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->select(
                    DB::raw("$rawDate as fecha"),
                    DB::raw('SUM(total) as monto'),
                    DB::raw("'ingreso' as tipo")
                )
                ->groupBy(DB::raw($rawDate));

            $egresos = Purchase::whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->select(
                    DB::raw("$rawDate as fecha"),
                    DB::raw('SUM(total) as monto'),
                    DB::raw("'egreso' as tipo")
                )
                ->groupBy(DB::raw($rawDate));

            $flujoCaja = $ingresos->union($egresos)
                ->orderBy('fecha') // 'fecha' alias should work in union
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

    /**
     * Obtener años que tienen movimientos (ventas o compras)
     */
    public function getAniosConMovimientos()
    {
        $error = $this->verificarPermiso();
        if ($error)
            return $error;

        try {
            // Detección de driver para compatibilidad SQL
            $connection = config('database.default');
            $driver = config("database.connections.{$connection}.driver");
            $isPgsql = $driver === 'pgsql';

            $rawYear = $isPgsql ? 'EXTRACT(YEAR FROM created_at)' : 'YEAR(created_at)';

            // Obtener años únicos de ventas
            $aniosVentas = Sale::select(DB::raw("DISTINCT $rawYear as anio"))
                ->whereNotNull('created_at')
                ->pluck('anio');

            // Obtener años únicos de compras
            $aniosCompras = Purchase::select(DB::raw("DISTINCT $rawYear as anio"))
                ->whereNotNull('created_at')
                ->pluck('anio');

            // Combinar y ordenar años únicos
            $anios = $aniosVentas->merge($aniosCompras)
                ->unique()
                ->sort()
                ->values()
                ->toArray();

            // Castear a int por si PostgreSQL devuelve string
            $anios = array_map('intval', $anios);

            return response()->json([
                'success' => true,
                'data' => $anios
            ]);
        } catch (\Exception $e) {
            // Loguear error pero no devolver 500 al frontend para evitar errores en consola
            \Log::error('Error al obtener años con movimientos: ' . $e->getMessage());

            return response()->json([
                'success' => true,
                'data' => [Carbon::now()->year], // Fallback al año actual
                'message' => 'Usando año actual por defecto debido a error interno'
            ]);
        }
    }
    public function generarReporte(Request $request)
    {
        $error = $this->verificarPermiso();
        if ($error)
            return $error;

        try {
            $tipo = $request->input('tipo', 'anual'); // mensual, trimestral, anual
            $anio = $request->input('anio', Carbon::now()->year);
            $mes = $request->input('mes'); // 1-12
            $trimestre = $request->input('trimestre'); // 1-4

            // Validar tipo
            if (!in_array($tipo, ['mensual', 'anual', 'trimestral'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tipo de reporte inválido.'
                ], 400);
            }

            // Configurar fechas según el tipo
            if ($tipo === 'mensual') {
                if (!$mes || $mes < 1 || $mes > 12) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Mes inválido. Debe estar entre 1 y 12.'
                    ], 400);
                }
                $fechaInicio = Carbon::create($anio, $mes, 1)->startOfMonth();
                $fechaFin = Carbon::create($anio, $mes, 1)->endOfMonth();
            } elseif ($tipo === 'trimestral') {
                if (!$trimestre || $trimestre < 1 || $trimestre > 4) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Trimestre inválido. Debe estar entre 1 y 4.'
                    ], 400);
                }
                $mesInicio = ($trimestre - 1) * 3 + 1;
                $mesFin = $mesInicio + 2;
                $fechaInicio = Carbon::create($anio, $mesInicio, 1)->startOfMonth();
                $fechaFin = Carbon::create($anio, $mesFin, 1)->endOfMonth();
            } else {
                $fechaInicio = Carbon::create($anio, 1, 1)->startOfYear();
                $fechaFin = Carbon::create($anio, 12, 31)->endOfYear();
            }

            // Obtener ventas del período
            $ventas = Sale::with(['items.product', 'client'])
                ->whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->get();

            // Obtener compras del período
            $compras = Purchase::with(['items.product', 'provider'])
                ->whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->get();

            // Calcular totales
            $totalVentas = $ventas->sum('total');
            $totalCompras = $compras->sum('total');
            $ganancia = $totalVentas - $totalCompras;

            // Ventas por mes (para reportes anuales o trimestrales)
            $ventasPorMes = [];
            if ($tipo === 'anual' || $tipo === 'trimestral') {
                $startM = $tipo === 'trimestral' ? $fechaInicio->month : 1;
                $endM = $tipo === 'trimestral' ? $fechaFin->month : 12;

                for ($m = $startM; $m <= $endM; $m++) {
                    $ventasMes = $ventas->filter(function ($venta) use ($m) {
                        return Carbon::parse($venta->created_at)->month == $m;
                    });
                    $ventasPorMes[] = [
                        'mes' => $m,
                        'mes_nombre' => Carbon::create(null, $m, 1)->locale('es')->monthName,
                        'total' => $ventasMes->sum('total'),
                        'cantidad' => $ventasMes->count()
                    ];
                }
            }

            // Ventas por día (para reportes mensuales)
            $ventasPorDia = [];
            if ($tipo === 'mensual') {
                $diasEnMes = $fechaFin->day;
                for ($d = 1; $d <= $diasEnMes; $d++) {
                    $ventasDia = $ventas->filter(function ($venta) use ($d) {
                        return Carbon::parse($venta->created_at)->day == $d;
                    });
                    $ventasPorDia[] = [
                        'dia' => $d,
                        'total' => $ventasDia->sum('total'),
                        'cantidad' => $ventasDia->count()
                    ];
                }
            }

            // Productos más vendidos
            $productosVendidos = [];
            foreach ($ventas as $venta) {
                foreach ($venta->items as $item) {
                    $productId = $item->product_id;
                    if (!isset($productosVendidos[$productId])) {
                        $productosVendidos[$productId] = [
                            'nombre' => $item->product->nombre ?? 'Producto desconocido',
                            'cantidad' => 0,
                            'total' => 0
                        ];
                    }
                    $productosVendidos[$productId]['cantidad'] += $item->cantidad;
                    $productosVendidos[$productId]['total'] += $item->subtotal;
                }
            }
            $productosVendidos = collect($productosVendidos)->sortByDesc('cantidad')->take(10)->values();

            // Preparar respuesta
            $periodoData = [
                'anio' => $anio,
                'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                'fecha_fin' => $fechaFin->format('Y-m-d')
            ];

            if ($tipo === 'mensual') {
                $periodoData['mes'] = $mes;
                $periodoData['mes_nombre'] = Carbon::create($anio, $mes, 1)->locale('es')->monthName;
            } elseif ($tipo === 'trimestral') {
                $periodoData['trimestre'] = $trimestre;
            }

            $reporte = [
                'tipo' => $tipo,
                'periodo' => $periodoData,
                'resumen' => [
                    'total_ventas' => round($totalVentas, 2),
                    'total_compras' => round($totalCompras, 2),
                    'ganancia' => round($ganancia, 2),
                    'numero_ventas' => $ventas->count(),
                    'numero_compras' => $compras->count(),
                    'margen_ganancia' => $totalVentas > 0 ? round(($ganancia / $totalVentas) * 100, 2) : 0
                ],
                'ventas_por_mes' => $ventasPorMes,
                'ventas_por_dia' => $ventasPorDia,
                'productos_mas_vendidos' => $productosVendidos,
                'generado_en' => Carbon::now()->format('Y-m-d H:i:s')
            ];

            // Generar PDF
            $pdf = Pdf::loadView('pdf.reporte_financiero', compact('reporte'));

            // Nombre del archivo
            $filename = '';
            if ($tipo === 'mensual') {
                $filename = 'reporte_mensual_' . $anio . '_' . str_pad($mes, 2, '0', STR_PAD_LEFT) . '.pdf';
            } elseif ($tipo === 'trimestral') {
                $filename = 'reporte_trimestral_' . $anio . '_T' . $trimestre . '.pdf';
            } else {
                $filename = 'reporte_anual_' . $anio . '.pdf';
            }

            $ruta = storage_path('app/public/' . $filename);

            // Eliminar archivo existente si existe
            if (file_exists($ruta)) {
                unlink($ruta);
            }

            // Guardar PDF
            $pdf->save($ruta);

            return response()->json([
                'success' => true,
                'message' => 'Reporte generado exitosamente',
                'url' => asset('storage/' . $filename),
                'filename' => $filename
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar reporte',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
