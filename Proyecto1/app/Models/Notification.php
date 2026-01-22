<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
        'provider_id',
        'tipo',
        'mensaje',
        'cantidad_actual',
        'stock_minimo',
        'estado',
        'leida',
        'fecha_respuesta'
    ];

    protected $casts = [
        'leida' => 'boolean',
        'fecha_respuesta' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function provider()
    {
        return $this->belongsTo(Provider::class);
    }
}
