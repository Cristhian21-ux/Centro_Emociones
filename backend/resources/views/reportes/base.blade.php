<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>{{ $titulo }} · {{ $centro->nombre }}</title>
<style>
    @page { margin: 120px 42px 70px 42px; }
    body { font-family: 'DejaVu Sans', sans-serif; font-size: 10.5px; color: #303b3a; }
    header { position: fixed; top: -100px; left: 0; right: 0; height: 88px; text-align: center; border-bottom: 2px solid #246b68; }
    header img { height: 46px; }
    header .centro { font-size: 15px; font-weight: bold; color: #246b68; margin-top: 4px; }
    header .ruc { font-size: 9px; color: #5c6b68; }
    footer { position: fixed; bottom: -50px; left: 0; right: 0; height: 30px; border-top: 1px solid #cfe2da; font-size: 8.5px; color: #5c6b68; padding-top: 6px; }
    h1 { font-size: 15px; text-align: center; margin: 0 0 4px; color: #303b3a; }
    .meta { text-align: center; color: #5c6b68; font-size: 9px; margin-bottom: 14px; }
    h2 { font-size: 11.5px; color: #246b68; margin: 16px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #cfe2da; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #246b68; color: #ffffff; font-weight: bold; text-align: left; padding: 5px 6px; font-size: 9.5px; }
    td { padding: 5px 6px; border-bottom: 1px solid #e3ebe7; vertical-align: top; }
    tr:nth-child(even) td { background: #f4f8f6; }
    .num { text-align: right; }
    .centro-txt { text-align: center; }
    .resumen { margin: 0 0 10px; color: #5c6b68; }
    .vacio { text-align: center; color: #5c6b68; padding: 14px; border: 1px dashed #cfe2da; }
    .confidencial { margin-top: 16px; font-size: 8.5px; color: #5c6b68; text-align: center; }
</style>
</head>
<body>
<header>
    @if ($logo)
        <img src="{{ $logo }}" alt="Logo">
    @endif
    <div class="centro">{{ $centro->nombre }}</div>
    @if ($centro->ruc)
        <div class="ruc">RUC {{ $centro->ruc }}</div>
    @endif
</header>
<footer>{{ $centro->nombre }} · Generado por {{ $usuario->name }}</footer>

<h1>{{ $titulo }}</h1>
<div class="meta">Generado el {{ $generado->format('d/m/Y') }} a las {{ $generado->format('H:i') }}</div>

@yield('contenido')

<p class="confidencial">Documento confidencial. Contiene datos personales protegidos por la Ley N.º 29733.</p>
</body>
</html>
