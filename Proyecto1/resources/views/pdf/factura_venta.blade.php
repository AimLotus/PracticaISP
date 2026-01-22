<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Factura de Venta #{{ $venta->numero_factura }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 13px;
            color: #333;
            margin: 0;
            padding: 20px;
        }

        h2 {
            text-align: center;
            color: #004085;
            margin-bottom: 20px;
            font-weight: 700;
        }

        .header-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 40px;
        }

        .header-column {
            flex: 1 1 45%;
            border: 1px solid #004085;
            border-radius: 6px;
            padding: 15px 20px;
            box-sizing: border-box;
            background-color: #f0f7ff;
        }

        .header-column h3 {
            margin-top: 0;
            margin-bottom: 15px;
            border-bottom: 2px solid #004085;
            padding-bottom: 5px;
            color: #004085;
            font-weight: 700;
        }

        .header-column p {
            margin: 6px 0;
            font-size: 14px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }

        th {
            background-color: #004085;
            color: white;
            padding: 8px 10px;
            font-weight: 600;
            text-align: left;
            border-bottom: 2px solid #002752;
        }

        td {
            border-bottom: 1px solid #ddd;
            padding: 8px 10px;
        }

        tr:nth-child(even) td {
            background-color: #f9f9f9;
        }

        .totals {
            max-width: 300px;
            margin-left: auto;
            font-size: 14px;
            font-weight: 600;
            border-top: 2px solid #004085;
            padding-top: 10px;
        }

        .totals p {
            margin: 5px 0;
            display: flex;
            justify-content: space-between;
        }

        footer {
            text-align: center;
            font-size: 11px;
            color: #777;
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <h2>Factura de Venta #{{ $venta->numero_factura }}</h2>

    <div class="header-info">
        {{-- Detalles de la venta (primero) --}}
        <div class="header-column">
            <h3>Detalles</h3>
            <p><strong>Fecha:</strong> {{ $venta->created_at->format('d/m/Y') }}</p>
            <p><strong>Encargado de la venta:</strong> {{ $venta->user->name ?? 'No registrado' }}</p>
        </div>

        {{-- Información del cliente --}}
        <div class="header-column">
            <h3>Cliente</h3>
            <p><strong>Nombre:</strong> {{ $venta->client->nombre ?? 'Sin cliente' }}</p>
            <p><strong>Teléfono:</strong> {{ $venta->client->telefono ?? 'N/A' }}</p>
            <p><strong>Email:</strong> {{ $venta->client->email ?? 'N/A' }}</p>
            <p><strong>Dirección:</strong> {{ $venta->client->direccion ?? 'N/A' }}</p>
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
            @forelse($venta->items as $detalle)
                <tr>
                    <td>{{ $detalle->product->nombre ?? 'Producto eliminado' }}</td>
                    <td>{{ $detalle->product->codigo ?? 'N/A' }}</td>
                    <td>{{ $detalle->cantidad }}</td>
                    <td>${{ number_format($detalle->precio_unitario, 2) }}</td>
                    <td>${{ number_format($detalle->cantidad * $detalle->precio_unitario, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align:center; font-style: italic; color:#777;">No hay productos en esta venta.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="totals">
        <p><span>Subtotal:</span> <span>${{ number_format($venta->subtotal, 2) }}</span></p>
        <p><span>Impuesto:</span> <span>${{ number_format($venta->impuesto, 2) }}</span></p>
        <p><span>Total:</span> <span><strong>${{ number_format($venta->total, 2) }}</strong></span></p>
    </div>

    <footer>
        Gracias por su compra.<br>
        &copy; {{ date('Y') }} Tu Empresa
    </footer>
</body>
</html>