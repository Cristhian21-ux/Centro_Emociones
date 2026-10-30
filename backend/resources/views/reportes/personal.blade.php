@extends('reportes.base')

@section('contenido')
<h2>Psicólogos ({{ $psicologos->count() }})</h2>
@if ($psicologos->isEmpty())
    <p class="vacio">Aún no hay psicólogos registrados.</p>
@else
<table>
    <thead>
        <tr><th>N.º</th><th>Nombre</th><th>Especialidad</th><th>Correo</th><th>Estado</th><th class="num">Citas atendidas</th></tr>
    </thead>
    <tbody>
        @foreach ($psicologos as $i => $u)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $u->name }}</td>
                <td>{{ $u->especialidad }}</td>
                <td>{{ $u->email }}</td>
                <td>{{ $u->activo ? 'Activo' : 'Inactivo' }}</td>
                <td class="num">{{ $u->citas_atendidas }}</td>
            </tr>
        @endforeach
    </tbody>
</table>
@endif

<h2>Administración y recepción ({{ $otros->count() }})</h2>
@if ($otros->isEmpty())
    <p class="vacio">No hay otro personal registrado.</p>
@else
<table>
    <thead>
        <tr><th>N.º</th><th>Nombre</th><th>Rol</th><th>Correo</th><th>Estado</th></tr>
    </thead>
    <tbody>
        @foreach ($otros as $i => $u)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $u->name }}</td>
                <td>{{ $roles[$u->role] ?? $u->role }}</td>
                <td>{{ $u->email }}</td>
                <td>{{ $u->activo ? 'Activo' : 'Inactivo' }}</td>
            </tr>
        @endforeach
    </tbody>
</table>
@endif
@endsection
