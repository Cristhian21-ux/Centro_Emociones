<?php

return [
    /*
    | Modo clínica única: el sistema se instala para UN centro psicológico.
    | - Todas las funciones habilitadas, sin límites de psicólogos ni pacientes.
    | - Sin planes, sin suscripción y sin registro público de nuevos centros.
    | Con false funciona como SaaS multi-centro con planes (Gratuito, VIP, Premium).
    */
    'modo_unico' => (bool) env('MODO_CENTRO_UNICO', false),

    // Logo de los reportes PDF. Se recomienda JPG: funciona aunque PHP no tenga la extensión GD
    // (para PNG, dompdf necesita GD; si falta, el reporte se genera sin logo en vez de fallar).
    'logo' => env('CENTRO_LOGO', resource_path('img/logo-centro.jpg')),

    // Horario de atención. "dias" usa ISO (1 = lunes ... 7 = domingo).
    'horario' => [
        'inicio' => '08:00',
        'fin' => '18:00',
        'duracion' => 60,
        'dias' => [1, 2, 3, 4, 5, 6],
        'descanso' => ['13:00'],
    ],

    'canal_predeterminado' => env('CENTRO_CANAL', 'whatsapp'),

    'recordatorio_horas_antes' => 24,

    'especialidades' => [
        'Psicología clínica',
        'Psicología infantil y del adolescente',
        'Psicología de pareja y familia',
        'Neuropsicología',
        'Psicología educativa',
        'Terapia cognitivo-conductual',
    ],
];
