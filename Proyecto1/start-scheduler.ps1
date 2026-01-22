# Script para iniciar el Laravel Scheduler en Windows
# Ejecutar este script en una ventana de PowerShell separada

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  LARAVEL SCHEDULER - INICIANDO  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script ejecutará el scheduler de Laravel cada minuto." -ForegroundColor Yellow
Write-Host "Mantén esta ventana abierta mientras trabajas." -ForegroundColor Yellow
Write-Host ""
Write-Host "Tareas programadas:" -ForegroundColor Green
Write-Host "  - Verificación de stock bajo: 9:00 AM y 3:00 PM" -ForegroundColor White
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el scheduler" -ForegroundColor Red
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Loop infinito que ejecuta el scheduler cada minuto
while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Ejecutando scheduler..." -ForegroundColor Gray
    
    # Ejecutar el comando schedule:run
    php artisan schedule:run
    
    # Esperar 60 segundos
    Start-Sleep -Seconds 60
}
