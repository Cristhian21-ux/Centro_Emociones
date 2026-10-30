@extends('reportes.base')

@section('contenido')
<p class="resumen">Total de pacientes registrados: <strong>{{ $pacientes->count() }}</strong></p>
@if ($pacientes->isEmpty())
    <p class="vacio">Aún no hay pacientes registrados.</p>
@else
<table>
    <thead>
        <tr><th>N.º</th><th>Paciente</th><th>DNI</th><th>Celular</th><th>Correo</th><th>F. nacimiento</th><th>Registrado</th></tr>
    </thead>
    <tbody>
        @foreach ($pacientes as $i => $p)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $p->apellidos }}, {{ $p->nombres }}</td>
                <td>{{ $p->dni }}</td>
                <td>{{ $p->telefono }}</td>
                <td>{{ $p->email }}</td>
                <td>{{ $p->fecha_nacimiento?->format('d/m/Y') }}</td>
                <td>{{ $p->created_at?->format('d/m/Y') }}</td>
            </tr>
        @endforeach
    </tbody>
</table>
@endif
@endsection
