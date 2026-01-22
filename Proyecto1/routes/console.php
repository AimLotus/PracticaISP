<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Programar verificación de stock bajo
// Ejecutar todos los días a las 9:00 AM
Schedule::command('stock:check-low')->dailyAt('09:00')->name('check-low-stock')->onOneServer();

// También ejecutar a las 3:00 PM para una segunda verificación diaria
Schedule::command('stock:check-low')->dailyAt('15:00')->name('check-low-stock-afternoon')->onOneServer();
