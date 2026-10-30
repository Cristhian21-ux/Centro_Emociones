<?php

namespace App\Services;

use App\Models\Cita;
use App\Models\Evaluacion;
use App\Models\ListaEspera;
use App\Models\Paciente;
use App\Models\User;

/** Indicadores del panel del centro. Los usan la pantalla del panel y su reporte PDF. */
class MetricasCentro
{
    public static function calcular(User $usuario): array
    {
        $citas = Cita::query()->when($usuario->isPsicologo(), fn ($q) => $q->where('psicologo_id', $usuario->id));

        return [
            'pacientes' => Paciente::count(),
            'citas_hoy' => (clone $citas)->whereDate('fecha', today())->whereNotIn('estado', Cita::ESTADOS_LIBRES)->count(),
            'citas_pendientes_pago' => (clone $citas)->where('pagado', false)->whereIn('estado', ['pendiente'])->count(),
            'ingresos_mes' => (float) (clone $citas)->where('pagado', true)
                ->whereBetween('pagado_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('monto'),
            'en_espera' => ListaEspera::where('estado', 'en_espera')->count(),
            'alertas_evaluacion' => Evaluacion::where('alerta', true)->count(),
            'citas_por_estado' => (clone $citas)->selectRaw('estado, count(*) as total')->groupBy('estado')->pluck('total', 'estado'),
        ];
    }
}
