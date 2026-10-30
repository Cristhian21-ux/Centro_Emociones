import { useState } from 'react';
import { descargarPdf } from '../services/api';

const hoy = () => new Date().toISOString().slice(0, 10);

/** Botón "Descargar PDF" de un reporte. `tipo` = pacientes | personal | panel. */
export default function BotonPdf({ tipo, onError, children = 'Descargar PDF' }) {
  const [descargando, setDescargando] = useState(false);

  const descargar = async () => {
    setDescargando(true);
    const error = await descargarPdf(`/reportes/${tipo}`, `reporte-${tipo}-${hoy()}.pdf`);
    setDescargando(false);
    if (error) onError?.(error);
  };

  return (
    <button type="button" className="btn btn--fantasma btn--pdf" onClick={descargar} disabled={descargando}>
      {descargando ? 'Generando PDF…' : children}
    </button>
  );
}
