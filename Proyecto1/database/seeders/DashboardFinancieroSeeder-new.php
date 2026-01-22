<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardFinancieroSeeder extends Seeder
{
    public function run(): void
    {
        // Categorías y productos
        $productos = [
            ['nombre' => 'Vino Tinto Reserva', 'categoria' => 'Vinos', 'precio' => 45.00],
            ['nombre' => 'Vino Blanco Chardonnay', 'categoria' => 'Vinos', 'precio' => 38.00],
            ['nombre' => 'Taco de Carne Asada', 'categoria' => 'Tacos', 'precio' => 3.50],
            ['nombre' => 'Taco de Pollo', 'categoria' => 'Tacos', 'precio' => 3.00],
            ['nombre' => 'Taco de Pescado', 'categoria' => 'Tacos', 'precio' => 4.00],
            ['nombre' => 'Tiramisú', 'categoria' => 'Postres', 'precio' => 6.50],
            ['nombre' => 'Cheesecake', 'categoria' => 'Postres', 'precio' => 5.50],
            ['nombre' => 'Brownie con Helado', 'categoria' => 'Postres', 'precio' => 5.00],
            ['nombre' => 'Salmón al Pesto', 'categoria' => 'Platos Fuertes', 'precio' => 18.00],
            ['nombre' => 'Lomo de Res', 'categoria' => 'Platos Fuertes', 'precio' => 22.00],
            ['nombre' => 'Pechuga a la Plancha', 'categoria' => 'Platos Fuertes', 'precio' => 14.00],
            ['nombre' => 'Pizza Margarita', 'categoria' => 'Pizzas', 'precio' => 12.00],
            ['nombre' => 'Pizza Pepperoni', 'categoria' => 'Pizzas', 'precio' => 14.00],
            ['nombre' => 'Pizza Hawaiana', 'categoria' => 'Pizzas', 'precio' => 13.50],
            ['nombre' => 'Spaghetti Carbonara', 'categoria' => 'Pastas', 'precio' => 11.00],
            ['nombre' => 'Fettuccine Alfredo', 'categoria' => 'Pastas', 'precio' => 10.50],
            ['nombre' => 'Lasagna Bolognesa', 'categoria' => 'Pastas', 'precio' => 13.00],
            ['nombre' => 'Alitas Picantes', 'categoria' => 'Entradas', 'precio' => 8.00],
            ['nombre' => 'Nachos con Queso', 'categoria' => 'Entradas', 'precio' => 7.50],
            ['nombre' => 'Ensalada César', 'categoria' => 'Ensaladas', 'precio' => 9.00],
            ['nombre' => 'Ensalada Griega', 'categoria' => 'Ensaladas', 'precio' => 8.50],
            ['nombre' => 'Cerveza Nacional', 'categoria' => 'Cervezas', 'precio' => 3.00],
            ['nombre' => 'Cerveza Importada', 'categoria' => 'Cervezas', 'precio' => 4.50],
            ['nombre' => 'Limonada Natural', 'categoria' => 'Bebidas', 'precio' => 2.50],
            ['nombre' => 'Jugo de Naranja', 'categoria' => 'Bebidas', 'precio' => 3.00],
        ];

        echo "Insertando productos...\n";
        
        $productosIds = [];
        foreach ($productos as $producto) {
            $id = DB::table('products')->insertGetId([
                'codigo' => 'PROD-' . rand(1000, 9999),
                'nombre' => $producto['nombre'],
                'descripcion' => 'Delicioso ' . $producto['nombre'],
                'categoria' => $producto['categoria'],
                'precio_compra' => $producto['precio'] * 0.6,
                'precio_venta' => $producto['precio'],
                'stock_minimo' => 10,
                'tax_id' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $productosIds[] = ['id' => $id, 'precio' => $producto['precio']];
        }

        echo "Generando ventas...\n";

        $anio = date('Y');
        $ventasPorMes = [22, 25, 30, 35, 38, 35, 32, 30, 33, 36, 38, 28];

        foreach ($ventasPorMes as $mesIndex => $cantidad) {
            for ($i = 0; $i < $cantidad; $i++) {
                $fecha = Carbon::create($anio, $mesIndex + 1, rand(1, 28), rand(10, 22));

                $subtotal = 0;
                $cantProductos = rand(2, 5);
                $productosVenta = [];

                for ($j = 0; $j < $cantProductos; $j++) {
                    $prod = $productosIds[array_rand($productosIds)];
                    $cant = rand(1, 4);
                    $subtotal += $prod['precio'] * $cant;
                    $productosVenta[] = ['id' => $prod['id'], 'precio' => $prod['precio'], 'cantidad' => $cant];
                }

                $impuesto = $subtotal * 0.15;
                $total = $subtotal + $impuesto;

                $ventaId = DB::table('sales')->insertGetId([
                    'user_id' => 1,
                    'subtotal' => $subtotal,
                    'tax_amount' => $impuesto,
                    'total' => $total,
                    'payment_method' => ['cash', 'card', 'transfer'][rand(0, 2)],
                    'status' => 'completed',
                    'created_at' => $fecha,
                    'updated_at' => $fecha,
                ]);

                foreach ($productosVenta as $pv) {
                    DB::table('sale_items')->insert([
                        'sale_id' => $ventaId,
                        'product_id' => $pv['id'],
                        'quantity' => $pv['cantidad'],
                        'unit_price' => $pv['precio'],
                        'total' => $pv['precio'] * $pv['cantidad'],
                        'created_at' => $fecha,
                        'updated_at' => $fecha,
                    ]);
                }
            }
            echo "  Mes " . ($mesIndex + 1) . ": $cantidad ventas\n";
        }

        echo "Generando compras...\n";

        $comprasPorMes = [15, 18, 20, 22, 24, 22, 20, 19, 21, 23, 24, 18];

        foreach ($comprasPorMes as $mesIndex => $cantidad) {
            for ($i = 0; $i < $cantidad; $i++) {
                $fecha = Carbon::create($anio, $mesIndex + 1, rand(1, 28), rand(8, 18));

                $subtotal = 0;
                $cantProductos = rand(3, 6);
                $productosCompra = [];

                for ($j = 0; $j < $cantProductos; $j++) {
                    $prod = $productosIds[array_rand($productosIds)];
                    $cant = rand(5, 20);
                    $precioCompra = $prod['precio'] * 0.6;
                    $subtotal += $precioCompra * $cant;
                    $productosCompra[] = ['id' => $prod['id'], 'precio' => $precioCompra, 'cantidad' => $cant];
                }

                $impuesto = $subtotal * 0.15;
                $total = $subtotal + $impuesto;

                $compraId = DB::table('purchases')->insertGetId([
                    'user_id' => 1,
                    'supplier_id' => 1,
                    'subtotal' => $subtotal,
                    'tax_amount' => $impuesto,
                    'total' => $total,
                    'status' => 'received',
                    'created_at' => $fecha,
                    'updated_at' => $fecha,
                ]);

                foreach ($productosCompra as $pc) {
                    DB::table('purchase_items')->insert([
                        'purchase_id' => $compraId,
                        'product_id' => $pc['id'],
                        'quantity' => $pc['cantidad'],
                        'unit_price' => $pc['precio'],
                        'total' => $pc['precio'] * $pc['cantidad'],
                        'created_at' => $fecha,
                        'updated_at' => $fecha,
                    ]);
                }
            }
            echo "  Mes " . ($mesIndex + 1) . ": $cantidad compras\n";
        }

        echo "\n✅ Datos generados exitosamente!\n";
        echo "Productos: " . count($productos) . "\n";
        echo "Ventas: " . array_sum($ventasPorMes) . "\n";
        echo "Compras: " . array_sum($comprasPorMes) . "\n";
    }
}
