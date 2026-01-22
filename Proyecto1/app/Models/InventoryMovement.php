<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    protected $fillable = ['inventory_id', 'tipo', 'cantidad', 'motivo'];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }
}