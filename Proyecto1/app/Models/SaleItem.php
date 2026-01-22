<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $fillable = ['sale_id', 'product_id', 'cantidad', 'subtotal'];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Accesor para obtener el precio de venta del producto relacionado.
     */
    public function getPrecioUnitarioAttribute()
    {
        return $this->product?->precio_venta;
    }
}
