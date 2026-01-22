<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>Consulta sobre {{ $producto->nombre }}</title>
    <style type="text/css">
        /* Reset styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-text-size-adjust: 100% !important;
            -ms-text-size-adjust: 100% !important;
            -webkit-font-smoothing: antialiased !important;
        }
        img {
            border: 0 !important;
            outline: none !important;
        }
        p {
            margin: 0px !important;
            padding: 0px !important;
        }
        table {
            border-collapse: collapse;
            mso-table-lspace: 0px;
            mso-table-rspace: 0px;
        }
        td, a, span {
            border-collapse: collapse;
            mso-line-height-rule: exactly;
        }
        
        /* Custom styles */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, Helvetica, sans-serif;
            background-color: #ffffff;
        }
        .header {
            background-color: #ffffff;
            color: #333333;
            padding: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: normal;
            color: #333333;
        }
        .content {
            background-color: #ffffff;
            padding: 30px 20px;
        }
        .info-box {
            background-color: #f5f5f5;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-table {
            width: 100%;
            margin: 10px 0;
        }
        .info-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-label {
            font-weight: bold;
            color: #555555;
            width: 40%;
        }
        .info-value {
            color: #333333;
            text-align: right;
        }

        .footer {
            text-align: left;
            padding: 20px;
            color: #666666;
            font-size: 13px;
            background-color: #ffffff;
            border-top: 1px solid #e0e0e0;
        }
        
        p {
            margin: 10px 0;
            line-height: 1.6;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            .content {
                padding: 20px 15px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table class="email-container" role="presentation" width="600" border="0" cellspacing="0" cellpadding="0">
                    <!-- Header -->
                    <tr>
                        <td class="header">
                            <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">De: {{ $empresa->nombre_dueno ?? 'Administrador' }}</p>
                            <p style="margin: 0; font-size: 14px; color: #666;">{{ $empresa->nombre_empresa ?? 'Mi Empresa' }}</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td class="content">
                            <p style="font-size: 15px; color: #333333;">
                                Hola {{ $proveedor->nombre }},
                            </p>
                            
                            <p style="font-size: 14px; color: #333333;">
                                Soy {{ $empresa->nombre_dueno ?? 'Administrador' }} de {{ $empresa->nombre_empresa ?? 'Mi Empresa' }}. Quisiera consultarle sobre la disponibilidad del siguiente producto:
                            </p>
                            
                            <div class="info-box">
                                <table class="info-table" role="presentation" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td class="info-label">Producto:</td>
                                        <td class="info-value"><strong>{{ $producto->nombre }}</strong></td>
                                    </tr>
                                    <tr>
                                        <td class="info-label">Código:</td>
                                        <td class="info-value">{{ $producto->codigo }}</td>
                                    </tr>
                                    <tr>
                                        <td class="info-label">Cantidad que necesitamos:</td>
                                        <td class="info-value">
                                            Aproximadamente {{ $stockMinimo - $cantidadActual }} unidades
                                        </td>
                                    </tr>
                                    @if($producto->categoria)
                                    <tr>
                                        <td class="info-label">Categoría:</td>
                                        <td class="info-value">{{ $producto->categoria }}</td>
                                    </tr>
                                    @endif
                                </table>
                            </div>

                            <p style="font-size: 14px; color: #333333;">
                                ¿Podría confirmarme la disponibilidad y el precio actual de este producto? También me gustaría saber los tiempos de entrega.
                            </p>

                            <p style="font-size: 14px; color: #333333;">
                                Quedo atento a su respuesta.
                            </p>

                            <p style="font-size: 14px; color: #333333; margin-top: 25px;">
                                Saludos cordiales,
                            </p>
                            
                            <p style="font-size: 14px; color: #333333; margin-top: 10px; margin-bottom: 5px;">
                                <strong>{{ $empresa->nombre_dueno ?? 'Administrador' }}</strong><br>
                                {{ $empresa->nombre_empresa ?? 'Mi Empresa' }}<br>
                                Email: {{ config('mail.from.address') }}<br>
                                Tel: {{ $empresa->telefono ?? 'No registrado' }}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td class="footer">
                            <p style="margin: 0; font-size: 12px; color: #999999;">
                                Este correo fue enviado porque usted es proveedor de {{ $empresa->nombre_empresa ?? 'Mi Empresa' }}.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
