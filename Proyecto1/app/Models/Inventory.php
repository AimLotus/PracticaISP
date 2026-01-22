<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $table = 'inventory';
    protected $fillable = ['product_id', 'cantidad'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function movimientos()
    {
        return $this->hasMany(InventoryMovement::class);
    }
}