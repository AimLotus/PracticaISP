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
        // Crear tabla intermedia para relación muchos a muchos
        Schema::create('product_provider', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('provider_id')->constrained('providers')->onDelete('cascade');
            $table->boolean('is_primary')->default(false); // Proveedor principal
            $table->decimal('precio_proveedor', 10, 2)->nullable(); // Precio que ofrece este proveedor
            $table->timestamps();
            
            // Índice único para evitar duplicados
            $table->unique(['product_id', 'provider_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_provider');
    }
};
