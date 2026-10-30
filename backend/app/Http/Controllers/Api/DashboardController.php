<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auditoria;
use App\Services\MetricasCentro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(MetricasCentro::calcular($request->user()));
    }

    public function auditoria(Request $request): JsonResponse
    {
        return response()->json(
            Auditoria::with('usuario:id,name')
                ->when($request->filled('accion'), fn ($q) => $q->where('accion', 'like', $request->string('accion').'%'))
                ->latest('id')
                ->paginate(30)
        );
    }
}
