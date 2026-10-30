<?php

namespace Tests\Feature;

use App\Models\Auditoria;
use Tests\TestCase;

/** Reportes PDF de pacientes, psicólogos/personal y panel. */
class ReporteTest extends TestCase
{
    public function test_descarga_el_reporte_de_pacientes_en_pdf(): void
    {
        $centro = $this->centro('premium');
        $this->comoUsuario('recepcionista', $centro);
        $this->paciente($centro, ['nombres' => 'María', 'apellidos' => 'Quispe']);

        $respuesta = $this->get('/api/reportes/pacientes')->assertOk();

        $this->assertSame('application/pdf', $respuesta->headers->get('Content-Type'));
        $this->assertStringContainsString('reporte-pacientes-', $respuesta->headers->get('Content-Disposition'));
        $this->assertStringStartsWith('%PDF', $respuesta->getContent());
    }

    public function test_descarga_el_reporte_del_panel_y_queda_en_la_auditoria(): void
    {
        $centro = $this->centro('premium');
        $this->comoUsuario('psicologo', $centro);

        $this->get('/api/reportes/panel')->assertOk()->assertHeader('Content-Type', 'application/pdf');

        $this->assertTrue(Auditoria::where('accion', 'reporte.descargado')->exists());
    }

    public function test_el_reporte_de_personal_es_solo_para_administracion(): void
    {
        $centro = $this->centro('premium');
        $this->comoUsuario('recepcionista', $centro);
        $this->getJson('/api/reportes/personal')->assertForbidden();

        $this->comoUsuario('admin', $centro);
        $this->get('/api/reportes/personal')->assertOk()->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_sin_sesion_no_se_descargan_reportes(): void
    {
        $this->getJson('/api/reportes/pacientes')->assertUnauthorized();
    }

    public function test_el_reporte_solo_incluye_pacientes_del_propio_centro(): void
    {
        $propio = $this->centro('premium');
        $ajeno = $this->centro('premium');
        $this->paciente($ajeno, ['nombres' => 'Ajeno', 'apellidos' => 'OtroCentro', 'dni' => '11112222']);
        $this->paciente($propio, ['nombres' => 'Propio', 'apellidos' => 'MiCentro', 'dni' => '33334444']);
        $this->comoUsuario('admin', $propio);

        $html = $this->vistaPacientes();

        $this->assertStringContainsString('MiCentro', $html);
        $this->assertStringNotContainsString('OtroCentro', $html);
        $this->assertStringContainsString($propio->nombre, $html);
    }

    /** HTML que se convierte en PDF (se revisa el contenido sin decodificar el PDF). */
    private function vistaPacientes(): string
    {
        $usuario = auth()->user();

        return view('reportes.pacientes', [
            'pacientes' => \App\Models\Paciente::orderBy('apellidos')->get(),
            'titulo' => 'Reporte de pacientes', 'centro' => $usuario->centro, 'usuario' => $usuario,
            'logo' => null, 'generado' => now(), 'estados' => [], 'roles' => [],
        ])->render();
    }
}
