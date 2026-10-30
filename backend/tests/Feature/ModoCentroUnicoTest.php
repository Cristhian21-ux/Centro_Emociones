<?php

namespace Tests\Feature;

use Tests\TestCase;

/** Instalación para una sola clínica (MODO_CENTRO_UNICO=true): sin planes, suscripción ni registro público. */
class ModoCentroUnicoTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['centro.modo_unico' => true]);
    }

    public function test_la_configuracion_publica_informa_el_modo(): void
    {
        $this->getJson('/api/config')->assertOk()->assertJsonPath('modo_centro_unico', true);
    }

    public function test_el_registro_publico_de_centros_esta_desactivado(): void
    {
        $this->postJson('/api/auth/registro', [
            'centro' => 'Otro centro', 'name' => 'Ana', 'email' => 'ana@otro.pe',
            'password' => 'Clave12345', 'password_confirmation' => 'Clave12345',
        ])->assertNotFound();

        $this->assertDatabaseMissing('users', ['email' => 'ana@otro.pe']);
    }

    public function test_no_se_puede_cambiar_ni_consultar_la_suscripcion(): void
    {
        $this->comoUsuario('admin', $this->centro('gratuito'));

        $this->getJson('/api/suscripcion')->assertNotFound();
        $this->postJson('/api/suscripcion/cambiar', ['plan' => 'premium', 'ciclo' => 'mensual'])->assertNotFound();
        $this->getJson('/api/planes')->assertNotFound();
    }

    public function test_todas_las_funciones_estan_habilitadas_sin_importar_el_plan(): void
    {
        $centro = $this->centro('gratuito');
        $this->comoUsuario('psicologo', $centro);

        $this->getJson('/api/evaluaciones')->assertOk();
        $this->postJson('/api/ia/emociones', ['texto' => 'Me siento tranquilo y feliz hoy'])->assertOk();
    }

    public function test_no_hay_limite_de_psicologos_ni_de_pacientes(): void
    {
        $centro = $this->centro('gratuito'); // el plan gratuito permitía 2 psicólogos y 50 pacientes
        $this->comoUsuario('admin', $centro);
        foreach (range(1, 3) as $i) {
            $this->usuario('psicologo', $centro);
        }
        foreach (range(1, 50) as $i) {
            $this->paciente($centro);
        }

        $this->postJson('/api/personal', [
            'name' => 'Ps. Nueva', 'email' => 'nueva@centro.pe', 'role' => 'psicologo',
            'especialidad' => 'Psicología clínica', 'password' => 'Clave12345',
        ])->assertCreated();

        $this->postJson('/api/pacientes', ['nombres' => 'Luis', 'apellidos' => 'Rojas', 'dni' => '45678912'])->assertCreated();
    }
}
