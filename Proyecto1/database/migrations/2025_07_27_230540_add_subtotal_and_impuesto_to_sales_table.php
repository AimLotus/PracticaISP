<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'subtotal')) {
                $table->decimal('subtotal', 10, 2)->default(0)->after('numero_factura');
            }
            if (!Schema::hasColumn('sales', 'impuesto')) {
                $table->decimal('impuesto', 10, 2)->default(0)->after('subtotal');
            }
        });
    }

    public function down()
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'subtotal')) {
                $table->dropColumn('subtotal');
            }
            if (Schema::hasColumn('sales', 'impuesto')) {
                $table->dropColumn('impuesto');
            }
        });
    }
};
