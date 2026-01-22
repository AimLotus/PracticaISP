<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'categoria',
        'precio_compra',
        'precio_venta',
        'stock_minimo',
        'tax_id',
    ];

    public function tax()
    {
        return $this->belongsTo(Tax::class, 'tax_id');
    }

    public function inventory()
    {
        return $this->hasOne(Inventory::class);
    }
    
    public function providers()
    {
        return $this->belongsToMany(Provider::class, 'product_provider')
                    ->withPivot('is_primary', 'precio_proveedor')
                    ->withTimestamps();
    }

    // Acceso rápido al stock actual vía inventario
    public function getStockAttribute()
    {
        return $this->inventory ? $this->inventory->cantidad : 0;
    }
}