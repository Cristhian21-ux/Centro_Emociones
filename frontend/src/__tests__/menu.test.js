import { describe, expect, it } from 'vitest';
import { modulosPara, rutaInicial } from '../utils/menu';

const usuario = (role, plan = {}) => ({ role, centro: { plan: { codigo: 'x', ...plan } } });
const rutas = (u) => modulosPara(u).map((m) => m.ruta);

describe('menú por rol y plan', () => {
  it('recepción no ve historias clínicas', () => {
    expect(rutas(usuario('recepcionista'))).not.toContain('/historias');
    expect(rutas(usuario('recepcionista'))).toContain('/espera');
  });

  it('psicólogo ve historias pero no personal', () => {
    const r = rutas(usuario('psicologo'));
    expect(r).toContain('/historias');
    expect(r).not.toContain('/personal');
  });

  it('evaluaciones solo aparece si el plan lo incluye', () => {
    expect(rutas(usuario('psicologo', { evaluaciones: false }))).not.toContain('/evaluaciones');
    expect(rutas(usuario('psicologo', { evaluaciones: true }))).toContain('/evaluaciones');
  });

  it('superadmin solo ve la plataforma y entra a ella', () => {
    const sa = { role: 'superadmin', centro: null };
    expect(rutas(sa)).toEqual(['/plataforma']);
    expect(rutaInicial(sa)).toBe('/plataforma');
  });

  it('en modo clínica única se ven todas las funciones y no "Mi suscripción"', () => {
    const admin = usuario('admin', { evaluaciones: false, analisis_emociones: false });
    const r = modulosPara(admin, true).map((m) => m.ruta);
    expect(r).toContain('/evaluaciones');
    expect(r).toContain('/emociones');
    expect(r).not.toContain('/suscripcion');
    expect(rutas(admin)).toContain('/suscripcion');
  });

  it('sin usuario no hay menú', () => {
    expect(modulosPara(null)).toEqual([]);
  });
});
