<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Agregar campo fecha a purchases
        Schema::table('purchases', function (Blueprint $table) {
            $table->timestamp('fecha')->nullable()->after('total');
        });

        // Agregar campo fecha a sales
        Schema::table('sales', function (Blueprint $table) {
            $table->timestamp('fecha')->nullable()->after('total');
        });

        // Copiar created_at a fecha para registros existentes
        \DB::statement('UPDATE purchases SET fecha = created_at WHERE fecha IS NULL');
        \DB::statement('UPDATE sales SET fecha = created_at WHERE fecha IS NULL');

        // Hacer el campo NOT NULL después de copiar los datos
        Schema::table('purchases', function (Blueprint $table) {
            $table->timestamp('fecha')->nullable(false)->change();
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->timestamp('fecha')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn('fecha');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('fecha');
        });
    }
};
