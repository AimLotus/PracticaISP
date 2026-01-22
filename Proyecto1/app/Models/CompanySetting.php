<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = [
        'nombre_empresa',
        'nombre_dueno',
        'logo_path',
        'ruc',
        'direccion',
        'telefono',
        'email'
    ];

    /**
     * Obtener la configuración actual de la empresa
     */
    public static function current()
    {
        return self::first();
    }

    /**
     * Obtener la URL completa del logo
     */
    public function getLogoUrlAttribute()
    {
        if ($this->logo_path) {
            return url('/storage/' . $this->logo_path);
        }
        return null;
    }
}
