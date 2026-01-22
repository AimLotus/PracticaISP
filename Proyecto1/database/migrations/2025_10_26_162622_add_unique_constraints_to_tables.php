<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Primero, limpiar duplicados si existen
        
        // Limpiar duplicados en clients.ruc_ci
        DB::statement('
            DELETE FROM clients 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM (SELECT * FROM clients) AS c 
                WHERE ruc_ci IS NOT NULL 
                GROUP BY ruc_ci
            ) 
            AND ruc_ci IS NOT NULL
        ');
        
        // Limpiar duplicados en providers.ruc_ci
        DB::statement('
            DELETE FROM providers 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM (SELECT * FROM providers) AS p 
                WHERE ruc_ci IS NOT NULL 
                GROUP BY ruc_ci
            ) 
            AND ruc_ci IS NOT NULL
        ');
        
        // Agregar restricción UNIQUE a clients.ruc_ci
        Schema::table('clients', function (Blueprint $table) {
            $table->unique('ruc_ci');
        });
        
        // Agregar restricción UNIQUE a providers.ruc_ci
        Schema::table('providers', function (Blueprint $table) {
            $table->unique('ruc_ci');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Eliminar restricciones UNIQUE
        Schema::table('clients', function (Blueprint $table) {
            $table->dropUnique(['ruc_ci']);
        });
        
        Schema::table('providers', function (Blueprint $table) {
            $table->dropUnique(['ruc_ci']);
        });
    }
};
