<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paciente;
use App\Models\User;
use App\Services\Auditor;
use App\Services\MetricasCentro;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

/**
 * Reportes descargables en PDF con el nombre y el logo del centro.
 * Los datos salen filtrados por el centro del usuario (multi-tenant), igual que en la API.
 */
class ReporteController extends Controller
{
    public const ESTADOS_CITA = [
        'pendiente' => 'Pendiente de pago', 'confirmada' => 'Confirmada', 'atendida' => 'Atendida',
        'cancelada' => 'Cancelada', 'no_agendada' => 'No agendada',
    ];

    public const ROLES = ['admin' => 'Administración', 'recepcionista' => 'Recepción', 'psicologo' => 'Psicología'];

    public function pacientes(Request $request): Response
    {
        $pacientes = Paciente::orderBy('apellidos')->orderBy('nombres')->get();

        return $this->pdf($request, 'pacientes', 'Reporte de pacientes', compact('pacientes'));
    }

    public function personal(Request $request): Response
    {
        $personal = User::where('centro_id', $request->user()->centro_id)
            ->withCount(['citasComoPsicologo as citas_atendidas' => fn ($q) => $q->where('estado', 'atendida')])
            ->orderByRaw("CASE role WHEN 'psicologo' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END")
            ->orderBy('name')
            ->get();

        return $this->pdf($request, 'personal', 'Reporte de psicólogos y personal', [
            'psicologos' => $personal->where('role', 'psicologo')->values(),
            'otros' => $personal->where('role', '!=', 'psicologo')->values(),
        ]);
    }

    public function panel(Request $request): Response
    {
        $metricas = MetricasCentro::calcular($request->user());

        return $this->pdf($request, 'panel', 'Reporte del panel', compact('metricas'));
    }

    /** Arma el PDF con la plantilla común (logo, nombre del centro, fecha y paginación). */
    private function pdf(Request $request, string $tipo, string $titulo, array $datos): Response
    {
        $usuario = $request->user();
        $centro = $usuario->centro;
        Auditor::registrar('reporte.descargado', null, ['tipo' => $tipo]);

        $pdf = Pdf::loadView("reportes.$tipo", $datos + [
            'titulo' => $titulo,
            'centro' => $centro,
            'usuario' => $usuario,
            'logo' => self::logoBase64(),
            'generado' => now(),
            'estados' => self::ESTADOS_CITA,
            'roles' => self::ROLES,
        ])->setPaper('a4')
            ->setOption('isFontSubsettingEnabled', true); // incluye solo las letras usadas: PDF liviano

        // Número de página en el pie ("Página 1 de 3"), calculado al terminar de armar el PDF.
        $pdf->render();
        $dompdf = $pdf->getDomPDF();
        $lienzo = $dompdf->getCanvas();
        $lienzo->page_text(
            $lienzo->get_width() - 100,
            $lienzo->get_height() - 36,
            'Página {PAGE_NUM} de {PAGE_COUNT}',
            $dompdf->getFontMetrics()->getFont('DejaVu Sans'),
            6.5,
            [0.36, 0.42, 0.41],
        );

        return $pdf->download(sprintf('reporte-%s-%s.pdf', $tipo, now()->format('Y-m-d')));
    }

    private static function logoBase64(): ?string
    {
        $ruta = config('centro.logo');
        if (! $ruta || ! is_file($ruta)) {
            return null;
        }
        $tipo = mime_content_type($ruta) ?: 'image/jpeg';
        if ($tipo !== 'image/jpeg' && ! function_exists('imagecreatefrompng')) {
            // Sin la extensión GD dompdf no puede insertar PNG/GIF: mejor un reporte sin logo que un error.
            Log::warning('Reporte PDF sin logo: el logo no es JPG y PHP no tiene la extensión GD.', ['logo' => $ruta]);

            return null;
        }

        return 'data:'.$tipo.';base64,'.base64_encode((string) file_get_contents($ruta));
    }
}
