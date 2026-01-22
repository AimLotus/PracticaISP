<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    public function run()
    {
        // Crear roles
        $adminRole = Role::updateOrCreate(['nombre' => 'admin']);
        Role::updateOrCreate(['nombre' => 'ventas']);
        Role::updateOrCreate(['nombre' => 'dueno']);
        Role::updateOrCreate(['nombre' => 'inventario']);

        // Crear usuario admin solo si no existe
        User::firstOrCreate(
            ['email' => 'admin@hotmail.com'], // Cambia este correo si deseas
            [
                'name'     => 'admin',
                'password' => Hash::make('admin1'), // Cambia la contraseña también
                'rol_id'   => $adminRole->id,
            ]
        );    
    }
}


