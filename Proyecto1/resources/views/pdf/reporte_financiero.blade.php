<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Reporte Financiero {{ $reporte['tipo'] === 'mensual' ? 'Mensual' : 'Anual' }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px;
            color: #333;
            margin: 0;
            padding: 20px;
        }

        h1 {
            text-align: center;
            color: #004085;
            margin-bottom: 10px;
            font-weight: 700;
            font-size: 24px;
        }

        h2 {
            color: #004085;
            font-size: 16px;
            margin-top: 25px;
            margin-bottom: 15px;
            border-bottom: 2px solid #004085;
            padding-bottom: 5px;
        }

        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }

        .summary-cards {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 15px;
        }

        .summary-card {
            flex: 1;
            border: 2px solid #004085;
            border-radius: 8px;
            padding: 15px;
            background: linear-gradient(to bottom, #f0f7ff 0%, #ffffff 100%);
        }

        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #004085;
            font-size: 13px;
            text-transform: uppercase;
            font-weight: 600;
        }

        .summary-card .value {
            font-size: 20px;
            font-weight: bold;
            color: #004085;
        }

        .summary-card.positive .value {
            color: #28a745;
        }

        .summary-card.negative .value {
            color: #dc3545;
        }

        .info-section {
            background-color: #f0f7ff;
            border: 1px solid #004085;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
        }

        .info-section p {
            margin: 5px 0;
            font-size: 13px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th {
            background-color: #004085;
            color: white;
            padding: 10px 8px;
            font-weight: 600;
            text-align: left;
            border-bottom: 2px solid #002752;
            font-size: 12px;
        }

        td {
            border-bottom: 1px solid #ddd;
            padding: 8px;
            font-size: 12px;
        }

        tr:nth-child(even) td {
            background-color: #f9f9f9;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        footer {
            text-align: center;
            font-size: 10px;
            color: #777;
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }

        .page-break {
            page-break-after: always;
        }

        .highlight {
            background-color: #fff3cd;
            font-weight: bold;
        }
    </style>
</head>

<body>
    <h1>Reporte Financiero
        {{ $reporte['tipo'] === 'mensual' ? 'Mensual' : ($reporte['tipo'] === 'trimestral' ? 'Trimestral' : 'Anual') }}
    </h1>
    <p class="subtitle">
        @if($reporte['tipo'] === 'mensual')
            {{ $reporte['periodo']['mes_nombre'] }} {{ $reporte['periodo']['anio'] }}
        @elseif($reporte['tipo'] === 'trimestral')
            Trimestre {{ $reporte['periodo']['trimestre'] }} - {{ $reporte['periodo']['anio'] }}
        @else
            Año {{ $reporte['periodo']['anio'] }}
        @endif
        <br>
        Generado: {{ \Carbon\Carbon::parse($reporte['generado_en'])->format('d/m/Y H:i:s') }}
    </p>

    {{-- Información del período --}}
    <div class="info-section">
        <p><strong>Período:</strong> {{ \Carbon\Carbon::parse($reporte['periodo']['fecha_inicio'])->format('d/m/Y') }} -
            {{ \Carbon\Carbon::parse($reporte['periodo']['fecha_fin'])->format('d/m/Y') }}
        </p>
        <p><strong>Número de Ventas:</strong> {{ $reporte['resumen']['numero_ventas'] }}</p>
        <p><strong>Número de Compras:</strong> {{ $reporte['resumen']['numero_compras'] }}</p>
        <p><strong>Margen de Ganancia:</strong> {{ number_format($reporte['resumen']['margen_ganancia'], 2) }}%</p>
    </div>

    {{-- Resumen financiero --}}
    <div class="summary-cards">
        <div class="summary-card positive">
            <h3>Ventas Totales</h3>
            <div class="value">${{ number_format($reporte['resumen']['total_ventas'], 2) }}</div>
        </div>
        <div class="summary-card negative">
            <h3>Compras Totales</h3>
            <div class="value">${{ number_format($reporte['resumen']['total_compras'], 2) }}</div>
        </div>
        <div class="summary-card {{ $reporte['resumen']['ganancia'] >= 0 ? 'positive' : 'negative' }}">
            <h3>Ganancia Neta</h3>
            <div class="value">${{ number_format($reporte['resumen']['ganancia'], 2) }}</div>
        </div>
    </div>

    @if(($reporte['tipo'] === 'anual' || $reporte['tipo'] === 'trimestral') && count($reporte['ventas_por_mes']) > 0)
        {{-- Ventas por mes --}}
        <h2>Ventas por Mes</h2>
        <table>
            <thead>
                <tr>
                    <th>Mes</th>
                    <th class="text-right">Cantidad de Ventas</th>
                    <th class="text-right">Total Vendido</th>
                </tr>
            </thead>
            <tbody>
                @foreach($reporte['ventas_por_mes'] as $mes)
                    <tr>
                        <td>{{ $mes['mes_nombre'] }}</td>
                        <td class="text-right">{{ $mes['cantidad'] }}</td>
                        <td class="text-right">${{ number_format($mes['total'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if($reporte['tipo'] === 'mensual' && count($reporte['ventas_por_dia']) > 0)
        {{-- Ventas por día --}}
        <h2>Ventas por Día</h2>
        <table>
            <thead>
                <tr>
                    <th>Día</th>
                    <th class="text-right">Cantidad de Ventas</th>
                    <th class="text-right">Total Vendido</th>
                </tr>
            </thead>
            <tbody>
                @foreach($reporte['ventas_por_dia'] as $dia)
                    @if($dia['cantidad'] > 0)
                        <tr>
                            <td>Día {{ $dia['dia'] }}</td>
                            <td class="text-right">{{ $dia['cantidad'] }}</td>
                            <td class="text-right">${{ number_format($dia['total'], 2) }}</td>
                        </tr>
                    @endif
                @endforeach
            </tbody>
        </table>
    @endif

    @if(count($reporte['productos_mas_vendidos']) > 0)
        {{-- Top 10 productos más vendidos --}}
        <h2>Top 10 Productos Más Vendidos</h2>
        <table>
            <thead>
                <tr>
                    <th>Posición</th>
                    <th>Producto</th>
                    <th class="text-right">Cantidad Vendida</th>
                    <th class="text-right">Total Generado</th>
                </tr>
            </thead>
            <tbody>
                @foreach($reporte['productos_mas_vendidos'] as $index => $producto)
                    <tr class="{{ $index < 3 ? 'highlight' : '' }}">
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ $producto['nombre'] }}</td>
                        <td class="text-right">{{ number_format($producto['cantidad']) }}</td>
                        <td class="text-right">${{ number_format($producto['total'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <footer>
        Reporte generado automáticamente por el Sistema de Gestión<br>
        &copy; {{ date('Y') }} Tu Empresa - Todos los derechos reservados
    </footer>
</body>

</html>