<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tax;

class TaxSeeder extends Seeder
{
    public function run()
    {
        Tax::create(['nombre' => 'IVA', 'porcentaje' => 15, 'activo' => true]);
        Tax::create(['nombre' => 'ICE', 'porcentaje' => 12, 'activo' => false]); // Impuesto antiguo
    }
}

