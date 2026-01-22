<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Atributos que se pueden asignar masivamente
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'rol_id',
        'activo',
    ];

    /**
     * Atributos ocultos
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Atributos casteados
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'activo' => 'boolean',
    ];

    /**
     * Atributos que se agregan automáticamente a la serialización JSON
     */
    protected $with = ['role'];

    /**
     * Relación con Rol
     */
    public function rol()
    {
        return $this->belongsTo(Role::class, 'rol_id');
    }

    /**
     * Alias en inglés para la relación rol (compatibilidad frontend)
     */
    public function role()
    {
        return $this->belongsTo(Role::class, 'rol_id');
    }
}

