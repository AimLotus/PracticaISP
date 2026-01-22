<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserTestSeeder extends Seeder
{
    public function run()
    {
        // Obtener los roles
        $adminRole = Role::where('nombre', 'admin')->first();
        $ventasRole = Role::where('nombre', 'ventas')->first();
        $duenoRole = Role::where('nombre', 'dueno')->first();
        $inventarioRole = Role::where('nombre', 'inventario')->first();

        // Usuario Admin (ya existe, solo verificar)
        User::firstOrCreate(
            ['email' => 'admin@hotmail.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('admin1'),
                'rol_id' => $adminRole->id,
                'activo' => true,
            ]
        );

        // Usuario de Ventas
        User::firstOrCreate(
            ['email' => 'ventas@hotmail.com'],
            [
                'name' => 'Usuario Ventas',
                'password' => Hash::make('ventas123'),
                'rol_id' => $ventasRole->id,
                'activo' => true,
            ]
        );

        // Usuario Dueño
        User::firstOrCreate(
            ['email' => 'dueno@hotmail.com'],
            [
                'name' => 'Usuario Dueño',
                'password' => Hash::make('dueno123'),
                'rol_id' => $duenoRole->id,
                'activo' => true,
            ]
        );

        // Usuario de Inventario
        User::firstOrCreate(
            ['email' => 'inventario@hotmail.com'],
            [
                'name' => 'Usuario Inventario',
                'password' => Hash::make('inventario123'),
                'rol_id' => $inventarioRole->id,
                'activo' => true,
            ]
        );

        echo "Usuarios de prueba creados exitosamente!\n";
        echo "---------------------------------------------\n";
        echo "Admin: admin@hotmail.com / admin1\n";
        echo "Ventas: ventas@hotmail.com / ventas123\n";
        echo "Dueño: dueno@hotmail.com / dueno123\n";
        echo "Inventario: inventario@hotmail.com / inventario123\n";
    }
}
