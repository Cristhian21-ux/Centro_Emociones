@extends('reportes.base')

@section('contenido')
<h2>Indicadores</h2>
<table>
    <thead><tr><th>Indicador</th><th class="num">Valor</th></tr></thead>
    <tbody>
        <tr><td>Citas de hoy</td><td class="num">{{ $metricas['citas_hoy'] }}</td></tr>
        <tr><td>Pacientes registrados</td><td class="num">{{ $metricas['pacientes'] }}</td></tr>
        <tr><td>Citas por cobrar</td><td class="num">{{ $metricas['citas_pendientes_pago'] }}</td></tr>
        <tr><td>Ingresos del mes</td><td class="num">S/ {{ number_format($metricas['ingresos_mes'], 2, '.', ',') }}</td></tr>
        <tr><td>Pacientes en lista de espera</td><td class="num">{{ $metricas['en_espera'] }}</td></tr>
        <tr><td>Alertas clínicas (evaluaciones)</td><td class="num">{{ $metricas['alertas_evaluacion'] }}</td></tr>
    </tbody>
</table>

<h2>Citas por estado</h2>
@php($totalCitas = collect($metricas['citas_por_estado'])->sum())
@if ($totalCitas === 0)
    <p class="vacio">Aún no hay citas registradas.</p>
@else
<table>
    <thead><tr><th>Estado</th><th class="num">Citas</th><th class="num">Porcentaje</th></tr></thead>
    <tbody>
        @foreach ($metricas['citas_por_estado'] as $estado => $total)
            <tr>
                <td>{{ $estados[$estado] ?? $estado }}</td>
                <td class="num">{{ $total }}</td>
                <td class="num">{{ number_format($total * 100 / $totalCitas, 1) }} %</td>
            </tr>
        @endforeach
        <tr><td><strong>Total</strong></td><td class="num"><strong>{{ $totalCitas }}</strong></td><td class="num"><strong>100.0 %</strong></td></tr>
    </tbody>
</table>
@endif
@if ($usuario->isPsicologo())
    <p class="resumen">Las citas e ingresos corresponden solo a las citas de {{ $usuario->name }}.</p>
@endif
@endsection
