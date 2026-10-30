import axios from 'axios';

const CLAVE_TOKEN = 'emociones_token';

export const tokenStore = {
  get: () => localStorage.getItem(CLAVE_TOKEN),
  set: (token) => localStorage.setItem(CLAVE_TOKEN, token),
  clear: () => localStorage.removeItem(CLAVE_TOKEN),
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { Accept: 'application/json' },
});

// Adjunta el token Sanctum en cada petición.
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Ante un 401 la sesión expiró: se limpia y se vuelve al login.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear();
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

/** Mensaje legible a partir de un error de la API (validación 422, plan 402, etc.). */
export function mensajeError(error) {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat()[0];
  return data?.message || 'No se pudo conectar con el servidor.';
}

/**
 * GET que nunca rechaza: devuelve { data, error }. Así las pantallas siempre
 * manejan el fallo de carga (mostrando un aviso) en lugar de dejar promesas
 * rechazadas sin capturar.
 */
export async function obtener(ruta, config) {
  try {
    const { data } = await api.get(ruta, config);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: mensajeError(err) };
  }
}

/**
 * Descarga un reporte PDF de la API (con el token de la sesión) y lo guarda con `nombre`.
 * Devuelve null si todo salió bien, o el mensaje de error legible.
 */
export async function descargarPdf(ruta, nombre) {
  try {
    const { data } = await api.get(ruta, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return null;
  } catch (err) {
    // Con responseType 'blob' el error de la API también llega como Blob: se lee como JSON.
    const cuerpo = err?.response?.data;
    if (cuerpo instanceof Blob) {
      try {
        return mensajeError({ response: { data: JSON.parse(await cuerpo.text()) } });
      } catch {
        return 'No se pudo generar el reporte.';
      }
    }
    return mensajeError(err);
  }
}

export default api;
