<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Compra #{{ $compra->id }}</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 13px; padding: 20px; }
        h2 { text-align: center; color: #004085; }
        .header-info { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 40px; }
        .header-column {
            flex: 1;
            background-color: #f0f7ff;
            border: 1px solid #004085;
            padding: 15px;
            border-radius: 6px;
        }
        .header-column h3 { margin-top: 0; color: #004085; border-bottom: 2px solid #004085; padding-bottom: 5px; }
        .header-column p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px; border: 1px solid #ccc; text-align: left; }
        th { background-color: #004085; color: #fff; }
        tr:nth-child(even) td { background-color: #f9f9f9; }
        .totals { max-width: 300px; margin-left: auto; font-weight: bold; }
        .totals p { display: flex; justify-content: space-between; margin: 5px 0; }
        footer { text-align: center; font-size: 11px; color: #777; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
</head>
<body>
    <h2>Reporte de Compra #{{ $compra->numero_factura ?? $compra->id }}</h2>

    <div class="header-info">
        <div class="header-column">
            <h3>Detalles</h3>
            <p><strong>Fecha:</strong> {{ $compra->created_at->format('d/m/Y') }}</p>
            <p><strong>Encargado de la compra:</strong> {{ $compra->user->name ?? 'N/A' }}</p>
        </div>

        <div class="header-column">
            <h3>Proveedor</h3>
            <p><strong>Nombre:</strong> {{ $compra->provider->nombre ?? 'N/A' }}</p>
            <p><strong>Teléfono:</strong> {{ $compra->provider->telefono ?? 'N/A' }}</p>
            <p><strong>Email:</strong> {{ $compra->provider->email ?? 'N/A' }}</p>
            <p><strong>Dirección:</strong> {{ $compra->provider->direccion ?? 'N/A' }}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Producto</th>
                <th>Código</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @forelse($compra->items as $item)
                <tr>
                    <td>{{ $item->product->nombre ?? 'Eliminado' }}</td>
                    <td>{{ $item->product->codigo ?? 'N/A' }}</td>
                    <td>{{ $item->cantidad }}</td>
                    <td>${{ number_format($item->precio_unitario, 2) }}</td>
                    <td>${{ number_format($item->subtotal, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align:center;">No hay productos</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="totals">
        <p><span>Subtotal:</span> <span>${{ number_format($compra->subtotal, 2) }}</span></p>
        <p><span>Impuesto:</span> <span>${{ number_format($compra->impuesto, 2) }}</span></p>
        <p><span>Total:</span> <span>${{ number_format($compra->total, 2) }}</span></p>
    </div>

    <footer>
        Este es un reporte generado automáticamente.<br>
        &copy; {{ date('Y') }} Tu Empresa
    </footer>
</body>
</html>