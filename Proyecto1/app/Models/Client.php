<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = ['nombre', 'ruc_ci', 'email', 'telefono', 'direccion'];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}

