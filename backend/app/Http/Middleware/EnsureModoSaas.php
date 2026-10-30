<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Bloquea las funciones propias del SaaS multi-centro (registro público y suscripciones) en modo clínica única. */
class EnsureModoSaas
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('centro.modo_unico')) {
            return response()->json(['message' => 'Esta función no está disponible en esta instalación.'], 404);
        }

        return $next($request);
    }
}
