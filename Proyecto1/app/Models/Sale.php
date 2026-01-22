<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = [
        'client_id', 'numero_factura', 'subtotal', 'impuesto', 'total', 'fecha', 'user_id'
    ];

    protected $casts = [
        'fecha' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($sale) {
            // Generar numero_factura automáticamente
            $latest = self::whereDate('created_at', now()->toDateString())->count() + 1;
            $sale->numero_factura = 'FAC-' . now()->format('Ymd') . '-' . str_pad($latest, 4, '0', STR_PAD_LEFT);
        });
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function user()
{
    return $this->belongsTo(User::class);
}

}