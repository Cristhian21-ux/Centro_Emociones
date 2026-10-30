import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError, obtener } from '../services/api';
import Tabla from '../components/Tabla';
import Campo from '../components/Campo';
import Aviso from '../components/Aviso';

const FRANJAS = { cualquiera: 'Cualquier horario', manana: 'Mañana', tarde: 'Tarde' };

export default function ListaEspera() {
  const [lista, setLista] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [form, setForm] = useState({ paciente_id: '', franja: 'cualquiera', motivo: '' });
  const [aviso, setAviso] = useState({});
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    const { data, error } = await obtener('/lista-espera');
    if (error) setAviso({ error });
    else setLista(data);
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

  const agregar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/lista-espera', form);
      setAviso({ ok: 'Paciente agregado a la lista de espera.' });
      setForm({ paciente_id: '', franja: 'cualquiera', motivo: '' });
      await cargar();
    } catch (err) {
      setAviso({ error: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  const retirar = async (id) => {
    try {
      await api.delete(`/lista-espera/${id}`);
      setAviso({ ok: 'Paciente retirado de la lista de espera.' });
      await cargar();
    } catch (err) {
      setAviso({ error: mensajeError(err) });
    }
  };
  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <>
      <header className="cabecera"><h1>Lista de espera</h1><p>Al cancelarse una cita, el cupo se ofrece automáticamente al primero compatible.</p></header>
      <Aviso>{aviso.ok}</Aviso><Aviso tipo="error">{aviso.error}</Aviso>
      <div className="rejilla">
        <section className="tarjeta">
          <h2>Pacientes en espera</h2>
          <Tabla filas={lista} vacio="No hay pacientes en espera." columnas={[
            { titulo: 'Paciente', valor: (e) => `${e.paciente?.nombres} ${e.paciente?.apellidos}` },
            { titulo: 'Franja', valor: (e) => FRANJAS[e.franja] },
            { titulo: 'Estado', valor: (e) => (e.estado === 'notificado' ? `Cupo ofrecido ${e.cupo_fecha} ${e.cupo_hora}` : 'En espera') },
            { titulo: 'Acción', valor: (e) => <button type="button" className="btn btn--mini btn--peligro" onClick={() => retirar(e.id)}>Retirar</button> },
          ]} />
        </section>
        <form className="tarjeta formulario" onSubmit={agregar}>
          <h2>Agregar a la lista</h2>
          <Campo as="select" label="Paciente" nombre="paciente_id" value={form.paciente_id} onChange={cambiar} required>
            <option value="">Selecciona…</option>
            {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
          </Campo>
          <Campo as="select" label="Franja" nombre="franja" value={form.franja} onChange={cambiar}>
            {Object.entries(FRANJAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Campo>
          <Campo label="Motivo" nombre="motivo" value={form.motivo} onChange={cambiar} />
          <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Agregando…' : 'Agregar'}</button>
        </form>
      </div>
    </>
  );
}
