import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError, obtener } from '../services/api';
import Tabla from '../components/Tabla';
import Campo from '../components/Campo';
import Aviso from '../components/Aviso';

export default function Historias() {
  const [lista, setLista] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [form, setForm] = useState({ paciente_id: '', diagnostico: '', observaciones: '' });
  const [aviso, setAviso] = useState({});
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    const { data, error } = await obtener('/historias');
    if (error) setAviso({ error });
    else setLista(data.data);
  }, []);

  useEffect(() => {
    void cargar();
    const cargarPacientes = async () => {
      const { data, error } = await obtener('/pacientes');
      if (error) setAviso({ error });
      else setPacientes(data.data);
    };
    void cargarPacientes();
  }, [cargar]);

  const guardar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const { data } = await api.post('/historias', form);
      setAviso({ ok: data.emocion_detectada ? `Historia registrada. IA: emoción ${data.emocion_detectada}, riesgo ${data.nivel_riesgo}.` : 'Historia registrada.' });
      setForm({ paciente_id: '', diagnostico: '', observaciones: '' });
      await cargar();
    } catch (err) {
      setAviso({ error: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <>
      <header className="cabecera"><h1>Historias clínicas</h1><p>Información confidencial (Ley N.º 29733).</p></header>
      <Aviso>{aviso.ok}</Aviso><Aviso tipo="error">{aviso.error}</Aviso>
      <div className="rejilla">
        <section className="tarjeta">
          <h2>Registros</h2>
          <Tabla filas={lista} vacio="Aún no hay historias clínicas." columnas={[
            { titulo: 'Fecha', valor: (h) => h.created_at?.slice(0, 10) },
            { titulo: 'Paciente', valor: (h) => `${h.paciente?.nombres} ${h.paciente?.apellidos}` },
            { titulo: 'Diagnóstico', valor: (h) => h.diagnostico },
            { titulo: 'IA', valor: (h) => (h.emocion_detectada ? <span className={`estado estado--riesgo-${h.nivel_riesgo}`}>{h.emocion_detectada} · {h.nivel_riesgo}</span> : '—') },
          ]} />
        </section>
        <form className="tarjeta formulario" onSubmit={guardar}>
          <h2>Nueva historia</h2>
          <Campo as="select" label="Paciente" nombre="paciente_id" value={form.paciente_id} onChange={cambiar} required>
            <option value="">Selecciona…</option>
            {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
          </Campo>
          <Campo as="textarea" label="Diagnóstico" nombre="diagnostico" rows={3} value={form.diagnostico} onChange={cambiar} required />
          <Campo as="textarea" label="Observaciones de la sesión" nombre="observaciones" rows={4} value={form.observaciones} onChange={cambiar} />
          <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
        </form>
      </div>
    </>
  );
}
