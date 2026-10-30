import { useEffect, useRef, useState } from 'react';
import api, { mensajeError } from '../services/api';

/** Asistente de ayuda conectado al microservicio Python. */
export default function Chatbot() {
  const [abierto, setAbierto] = useState(false);
  const [pregunta, setPregunta] = useState('');
  const [mensajes, setMensajes] = useState([{ id: 0, de: 'bot', texto: '¡Hola! Pregúntame sobre citas, pagos, planes o evaluaciones.' }]);
  const [enviando, setEnviando] = useState(false);
  const siguienteId = useRef(1);
  const finMensajes = useRef(null);

  const agregar = (de, texto) => {
    const id = siguienteId.current;
    siguienteId.current += 1;
    setMensajes((m) => [...m, { id, de, texto }]);
  };

  // Mantiene visible el último mensaje.
  useEffect(() => { finMensajes.current?.scrollIntoView?.({ block: 'end' }); }, [mensajes, enviando]);

  const enviar = async (e) => {
    e.preventDefault();
    const texto = pregunta.trim();
    if (!texto || enviando) return;
    agregar('yo', texto);
    setPregunta('');
    setEnviando(true);
    try {
      const { data } = await api.post('/chatbot', { pregunta: texto });
      agregar('bot', data.respuesta);
    } catch (error) {
      agregar('bot', mensajeError(error));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={`chatbot ${abierto ? 'chatbot--abierto' : ''}`}>
      {abierto && (
        <div className="chatbot__panel" role="dialog" aria-label="Asistente">
          <div className="chatbot__cabecera">
            <strong>Asistente Emociones</strong>
            <small>Respuestas sobre el uso de la plataforma</small>
          </div>
          <div className="chatbot__mensajes" aria-live="polite">
            {mensajes.map((m) => <p key={m.id} className={`burbuja burbuja--${m.de}`}>{m.texto}</p>)}
            {enviando && <p className="burbuja burbuja--bot">Escribiendo…</p>}
            <div ref={finMensajes} />
          </div>
          <form onSubmit={enviar} className="chatbot__form">
            <input value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="Escribe tu pregunta" aria-label="Pregunta" />
            <button type="submit" className="btn" disabled={enviando || !pregunta.trim()}>Enviar</button>
          </form>
        </div>
      )}
      <button type="button" className="chatbot__boton" onClick={() => setAbierto(!abierto)} aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente'} aria-expanded={abierto}>
        {abierto ? '×' : '✦'}
      </button>
    </div>
  );
}
