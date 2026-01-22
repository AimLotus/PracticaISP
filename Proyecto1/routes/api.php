<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TaxController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\InventoryMovementController;
use App\Http\Controllers\Api\InventoryController;

use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ProviderController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\Api\FinancialController;
use App\Http\Controllers\Api\NotificationController;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // Usuarios (admin)
    Route::post('/users', [UserController::class, 'create']);
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::patch('/users/{user}/toggle-activo', [UserController::class, 'toggleActivo']);

    // Impuestos
    Route::get('/taxes', [TaxController::class, 'index']);
    Route::get('/taxes/{tax}', [TaxController::class, 'show']);
    Route::post('/taxes', [TaxController::class, 'store']);
    Route::put('/taxes/{tax}', [TaxController::class, 'update']);
    Route::delete('/taxes/{tax}', [TaxController::class, 'destroy']);
    Route::patch('/taxes/{tax}/toggle-activo', [TaxController::class, 'toggleActivo']);

    // Productos
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::get('/products/{product}/providers', [ProductController::class, 'getProviders']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    Route::get('/productos-inventario', [ProductController::class, 'inventario']);

    // Movimientos de inventario
    Route::get('inventory-movements', [InventoryMovementController::class, 'index']);
    Route::post('inventory-movements', [InventoryMovementController::class, 'store']);

    // Inventario
    Route::get('/inventario', [InventoryController::class, 'inventario']);
    Route::post('/inventario/check-low-stock', [InventoryController::class, 'checkLowStock']);

    // Clientes
    Route::prefix('clientes')->group(function () {
        Route::get('/', [ClientController::class, 'index']);
        Route::get('/count', [ClientController::class, 'count']);
        Route::post('/', [ClientController::class, 'store']);
        Route::get('/{cliente}', [ClientController::class, 'show']);
        Route::put('/{cliente}', [ClientController::class, 'update']);
        Route::delete('/{cliente}', [ClientController::class, 'destroy']);
    });

    // Proveedores
    Route::prefix('proveedores')->group(function () {
        Route::get('/', [ProviderController::class, 'index']);
        Route::get('/count', [ProviderController::class, 'countProviders']);
        Route::post('/', [ProviderController::class, 'store']);
        Route::get('/{proveedor}', [ProviderController::class, 'show']);
        Route::put('/{proveedor}', [ProviderController::class, 'update']);
        Route::delete('/{proveedor}', [ProviderController::class, 'destroy']);
    });

    // Ventas
    Route::prefix('ventas')->group(function () {
        Route::get('/', [SaleController::class, 'index']);
        Route::get('/stats', [SaleController::class, 'stats']);
        Route::post('/', [SaleController::class, 'store']);
        Route::get('/{venta}', [SaleController::class, 'show']);
        Route::put('/{venta}', [SaleController::class, 'update']);
        Route::delete('/{venta}', [SaleController::class, 'destroy']);
        Route::get('/{venta}/factura', [SaleController::class, 'generarFactura']);
    });

    // Compras
    Route::prefix('compras')->group(function () {
        Route::get('/', [PurchaseController::class, 'index']);
        Route::get('/stats', [PurchaseController::class, 'getPurchaseStats']);
        Route::post('/', [PurchaseController::class, 'store']);
        Route::get('/{compra}', [PurchaseController::class, 'show']);
        Route::put('/{compra}', [PurchaseController::class, 'update']);
        Route::delete('/{compra}', [PurchaseController::class, 'destroy']);
        Route::get('/{compra}/reporte', [PurchaseController::class, 'generarReporte']);
    });

    // Configuración de la empresa (admin y dueño)
    Route::prefix('empresa')->group(function () {
        Route::get('/config', [CompanySettingController::class, 'getConfig']);
        Route::put('/config', [CompanySettingController::class, 'updateConfig']);
        Route::post('/logo', [CompanySettingController::class, 'uploadLogo']);
        Route::delete('/logo', [CompanySettingController::class, 'deleteLogo']);
    });

    // Finanzas (admin y dueño)
    Route::prefix('finanzas')->group(function () {
        Route::get('/resumen', [FinancialController::class, 'getResumen']);
        Route::get('/ventas-periodo', [FinancialController::class, 'getVentasPorPeriodo']);
        Route::get('/ventas-categoria', [FinancialController::class, 'getVentasPorCategoria']);
        Route::get('/productos-mas-vendidos', [FinancialController::class, 'getProductosMasVendidos']);
        Route::get('/comparacion', [FinancialController::class, 'getComparacion']);
        Route::get('/inventario-stats', [FinancialController::class, 'getInventarioStats']);
        Route::get('/flujo-caja', [FinancialController::class, 'getFlujoCaja']);
        Route::get('/anios-con-movimientos', [FinancialController::class, 'getAniosConMovimientos']);
        Route::post('/generar-reporte', [FinancialController::class, 'generarReporte']);
    });

    // Notificaciones (solo admin/dueño)
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::patch('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('/{id}/accept', [NotificationController::class, 'accept']);
        Route::post('/{id}/reject', [NotificationController::class, 'reject']);
    });

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);

});