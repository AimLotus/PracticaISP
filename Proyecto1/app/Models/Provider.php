<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Provider extends Model
{
    protected $fillable = ['nombre', 'ruc_ci', 'email', 'telefono', 'direccion'];

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }
    
    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_provider')
                    ->withPivot('is_primary', 'precio_proveedor')
                    ->withTimestamps();
    }
}

