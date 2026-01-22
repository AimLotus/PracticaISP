De: {{ $empresa->nombre_dueno ?? 'Administrador' }}
{{ $empresa->nombre_empresa ?? 'Mi Empresa' }}

Hola {{ $proveedor->nombre }},

Soy {{ $empresa->nombre_dueno ?? 'Administrador' }} de {{ $empresa->nombre_empresa ?? 'Mi Empresa' }}. Quisiera consultarle sobre la disponibilidad del siguiente producto:

Producto: {{ $producto->nombre }}
Código: {{ $producto->codigo }}
@if($producto->categoria)
    Categoría: {{ $producto->categoria }}
@endif
Cantidad que necesitamos: Aproximadamente {{ $stockMinimo - $cantidadActual }} unidades

¿Podría confirmarme la disponibilidad y el precio actual de este producto? También me gustaría saber los tiempos de
entrega.

Quedo atento a su respuesta.

Saludos cordiales,

{{ $empresa->nombre_dueno ?? 'Administrador' }}
{{ $empresa->nombre_empresa ?? 'Mi Empresa' }}
Email: {{ config('mail.from.address') }}
Tel: {{ $empresa->telefono ?? 'No registrado' }}

---
Este correo fue enviado porque usted es proveedor de {{ $empresa->nombre_empresa ?? 'Mi Empresa' }}.