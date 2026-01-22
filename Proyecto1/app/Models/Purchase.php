<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    protected $fillable = [
        'provider_id',
        'numero_factura',
        'subtotal',
        'impuesto',
        'total',
        'fecha',
        'user_id'
    ];

    protected $casts = [
        'fecha' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($purchase) {
            // Formato automático: COMP-20250728-0001
            $latest = self::whereDate('created_at', now()->toDateString())->count() + 1;
            $purchase->numero_factura = 'COMP-' . now()->format('Ymd') . '-' . str_pad($latest, 4, '0', STR_PAD_LEFT);
        });
    }

    public function provider()
    {
        return $this->belongsTo(Provider::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function user()
{
    return $this->belongsTo(User::class);
}

}