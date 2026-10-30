import { afterEach, describe, expect, it, vi } from 'vitest';
import api, { descargarPdf, obtener } from '../services/api';

describe('obtener (GET que nunca rechaza)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('devuelve los datos cuando la API responde', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { total: 3 } });
    await expect(obtener('/dashboard')).resolves.toEqual({ data: { total: 3 }, error: null });
  });

  it('convierte el fallo en un mensaje legible en lugar de rechazar', async () => {
    vi.spyOn(api, 'get').mockRejectedValueOnce({ response: { data: { message: 'Sin permiso.' } } });
    await expect(obtener('/auditoria')).resolves.toEqual({ data: null, error: 'Sin permiso.' });
  });

  it('usa el mensaje de conexión cuando no hay respuesta del servidor', async () => {
    vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network Error'));
    await expect(obtener('/citas')).resolves.toEqual({ data: null, error: 'No se pudo conectar con el servidor.' });
  });
});

describe('descargarPdf', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lee el mensaje de error que llega como Blob', async () => {
    const cuerpo = new Blob([JSON.stringify({ message: 'No tienes permiso para esta acción.' })], { type: 'application/json' });
    vi.spyOn(api, 'get').mockRejectedValueOnce({ response: { data: cuerpo } });
    await expect(descargarPdf('/reportes/personal', 'x.pdf')).resolves.toBe('No tienes permiso para esta acción.');
  });
});
