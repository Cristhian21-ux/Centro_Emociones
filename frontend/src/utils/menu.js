/** Módulos del sistema y roles que pueden verlos (mismo RBAC que la API). */
export const MODULOS = [
  { ruta: '/panel', etiqueta: 'Panel', icono: '◎', roles: ['admin', 'recepcionista', 'psicologo'] },
  { ruta: '/citas', etiqueta: 'Citas y agenda', icono: '◷', roles: ['admin', 'recepcionista', 'psicologo'] },
  { ruta: '/pacientes', etiqueta: 'Pacientes', icono: '☺', roles: ['admin', 'recepcionista', 'psicologo'] },
  { ruta: '/espera', etiqueta: 'Lista de espera', icono: '⧗', roles: ['admin', 'recepcionista'] },
  { ruta: '/historias', etiqueta: 'Historias clínicas', icono: '✎', roles: ['admin', 'psicologo'] },
  { ruta: '/evaluaciones', etiqueta: 'Evaluaciones', icono: '✓', roles: ['admin', 'psicologo'], plan: 'evaluaciones' },
  { ruta: '/emociones', etiqueta: 'Análisis IA', icono: '✦', roles: ['admin', 'psicologo'], plan: 'analisis_emociones' },
  { ruta: '/personal', etiqueta: 'Personal', icono: '⚇', roles: ['admin'] },
  { ruta: '/suscripcion', etiqueta: 'Mi suscripción', icono: '★', roles: ['admin'], soloSaas: true },
  { ruta: '/auditoria', etiqueta: 'Auditoría', icono: '⌕', roles: ['admin'] },
  { ruta: '/plataforma', etiqueta: 'Centros SaaS', icono: '☁', roles: ['superadmin'] },
];

/**
 * Módulos visibles para el usuario. En modo clínica única no hay planes:
 * se muestran todas las funciones y se oculta "Mi suscripción".
 */
export function modulosPara(usuario, modoUnico = false) {
  if (!usuario) return [];
  const plan = usuario.centro?.plan || {};
  return MODULOS.filter((m) => {
    if (!m.roles.includes(usuario.role)) return false;
    if (modoUnico) return !m.soloSaas;
    return !m.plan || Boolean(plan[m.plan]);
  });
}

export function rutaInicial(usuario) {
  return usuario?.role === 'superadmin' ? '/plataforma' : '/panel';
}
