<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Actualizar el rol 'compras' a 'dueno' en la tabla roles
        DB::table('roles')
            ->where('nombre', 'compras')
            ->update(['nombre' => 'dueno']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir el cambio de 'dueno' a 'compras'
        DB::table('roles')
            ->where('nombre', 'dueno')
            ->update(['nombre' => 'compras']);
    }
};
