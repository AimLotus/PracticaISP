<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Inventory;


class ProductController extends Controller
{
    // Listar todos los productos con su impuesto
    public function index()
    {
        $productos = Product::with(['tax', 'inventory', 'providers'])->get();
        
        // Agregar stock actual a cada producto
        $productos = $productos->map(function($producto) {
            $producto->stock_actual = $producto->inventory ? $producto->inventory->cantidad : 0;
            return $producto;
        });
        
        return response()->json($productos);
    }

    // Mostrar un producto específico con impuesto
    public function show(Product $product)
    {
        $product->load('tax');
        return response()->json($product);
    }

    // Obtener los proveedores de un producto específico
    public function getProviders(Product $product)
    {
        $providers = $product->providers->map(function($provider) {
            return [
                'id' => $provider->id,
                'nombre' => $provider->nombre,
                'email' => $provider->email,
                'telefono' => $provider->telefono,
                'is_primary' => $provider->pivot->is_primary,
                'precio_proveedor' => $provider->pivot->precio_proveedor
            ];
        });
        
        return response()->json($providers);
    }

    // Crear un producto y su inventario inicial en 0
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'codigo' => 'required|string|unique:products,codigo',
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'categoria' => 'nullable|string|max:100',
            'precio_compra' => 'required|numeric|min:0',
            'precio_venta' => 'required|numeric|min:0',
            'stock_minimo' => 'required|integer|min:0',
            'tax_id' => 'required|integer|exists:taxes,id',
            'providers' => 'nullable|array',
            'providers.*.provider_id' => 'required|exists:providers,id',
            'providers.*.is_primary' => 'nullable|boolean',
            'providers.*.precio_proveedor' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product = Product::create($request->except('providers'));

        // Crear inventario inicial con cantidad 0
        Inventory::create([
            'product_id' => $product->id,
            'cantidad' => 0,
        ]);
        
        // Vincular proveedores si existen
        if ($request->has('providers') && is_array($request->providers)) {
            foreach ($request->providers as $provider) {
                $product->providers()->attach($provider['provider_id'], [
                    'is_primary' => $provider['is_primary'] ?? false,
                    'precio_proveedor' => $provider['precio_proveedor'] ?? null,
                ]);
            }
        }

        return response()->json($product->load(['tax', 'providers']), 201);
    }
    
    // Actualizar producto (sin stock)
    public function update(Request $request, Product $product)
    {
        $validator = Validator::make($request->all(), [
            'codigo' => 'sometimes|required|string|unique:products,codigo,' . $product->id,
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'categoria' => 'nullable|string|max:100',
            'precio_compra' => 'sometimes|required|numeric|min:0',
            'precio_venta' => 'sometimes|required|numeric|min:0',
            'stock_minimo' => 'sometimes|required|integer|min:0',
            'tax_id' => 'sometimes|required|integer|exists:taxes,id',
            'providers' => 'nullable|array',
            'providers.*.provider_id' => 'required|exists:providers,id',
            'providers.*.is_primary' => 'nullable|boolean',
            'providers.*.precio_proveedor' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product->update($request->except('providers'));
        
        // Actualizar proveedores si se envían
        if ($request->has('providers')) {
            // Eliminar relaciones existentes
            $product->providers()->detach();
            
            // Agregar nuevas relaciones
            if (is_array($request->providers)) {
                foreach ($request->providers as $provider) {
                    $product->providers()->attach($provider['provider_id'], [
                        'is_primary' => $provider['is_primary'] ?? false,
                        'precio_proveedor' => $provider['precio_proveedor'] ?? null,
                    ]);
                }
            }
        }

        return response()->json($product->load(['tax', 'providers']));
    }

    // Eliminar producto (esto eliminará inventario por cascada)
    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(null, 204);
    }

    public function inventario()
{
    $inventarios = Inventory::with('product')->get();

    $resultado = $inventarios->map(function ($inv) {
        return [
            'id' => $inv->id,             // id del inventario para usar en frontend
            'producto' => [               // objeto producto
                'nombre' => $inv->product->nombre,
                // aquí puedes agregar otros campos de product si quieres
            ],
            'cantidad' => $inv->cantidad,
        ];
    });

    return response()->json($resultado);
}

}
