<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tax extends Model
{
    protected $fillable = [
        'nombre',
        'porcentaje',
        'activo',
    ];

    public function productos()
    {
        return $this->hasMany(Product::class);
    }
}

