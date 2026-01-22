<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    protected $fillable = ['purchase_id', 'product_id', 'cantidad', 'subtotal'];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Accesor para obtener el precio de compra del producto relacionado.
     */
    public function getPrecioUnitarioAttribute()
{
    return $this->precio_compra ?? $this->product?->precio_compra;
}

}