import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError, obtener } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Campo from '../components/Campo';
import Tabla from '../components/Tabla';
import Aviso from '../components/Aviso';

export const ESTADOS = {
  pendiente: 'Pendiente de pago', confirmada: 'Confirmada', atendida: 'Atendida',
  cancelada: 'Cancelada', no_agendada: 'No agendada',
};

/** Mismos valores que acepta la API (Cita::METODOS_PAGO). */
export const METODOS_PAGO = { yape: 'Yape', plin: 'Plin', efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta' };

const manana = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const comprobanteSugerido = (cita) => `B001-${String(cita.id).padStart(5, '0')}`;

export default function Citas() {
  const { usuario } = useAuth();
  const esRecepcion = ['admin', 'recepcionista'].includes(usuario.role);
  const esPsicologo = ['admin', 'psicologo'].includes(usuario.role);
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [psicologos, setPsicologos] = useState([]);
  const [form, setForm] = useState({ paciente_id: '', psicologo_id: '', fecha: manana(), hora: '', motivo: '' });
  const [libres, setLibres] = useState([]);
  const [aviso, setAviso] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [cobro, setCobro] = useState(null); // { cita, monto, comprobante, metodo }
  const [versionAgenda, setVersionAgenda] = useState(0); // fuerza a recalcular las horas libres

  const cargar = useCallback(async () => {
    const { data, error } = await obtener('/citas');
    if (error) setAviso({ error });
    else setCitas(data.data);
  }, []);

  useEffect(() => {
    void cargar();
    if (!esRecepcion) return;
    const cargarCatalogos = async () => {
      const [respPacientes, respPersonal] = await Promise.all([
        obtener('/pacientes'),
        obtener('/personal', { params: { role: 'psicologo' } }),
      ]);
      const error = respPacientes.error || respPersonal.error;
      if (error) setAviso({ error });
      if (respPacientes.data) setPacientes(respPacientes.data.data);
      if (respPersonal.data) setPsicologos(respPersonal.data.filter((p) => p.activo));
    };
    void cargarCatalogos();
  }, [cargar, esRecepcion]);

  useEffect(() => {
    if (!form.psicologo_id || !form.fecha) return undefined;
    let vigente = true; // evita que una respuesta tardía pise a la más reciente
    const consultar = async () => {
      const { data } = await obtener('/agenda/disponibilidad', { params: { psicologo_id: form.psicologo_id, fecha: form.fecha } });
      if (vigente) setLibres(data?.libres ?? []);
    };
    void consultar();
    return () => { vigente = false; };
  }, [form.psicologo_id, form.fecha, versionAgenda]);

  const cambiar = (e) => {
    const { name, value } = e.target;
    // Al cambiar de psicólogo o de fecha, la hora elegida ya no es válida.
    const reiniciaHora = name === 'psicologo_id' || name === 'fecha';
    setForm((f) => ({ ...f, [name]: value, ...(reiniciaHora ? { hora: '' } : {}) }));
  };

  const agendar = async (e) => {
    e.preventDefault();
    if (!form.hora) {
      setAviso({ error: 'Elige una hora libre para la cita.' });
      return;
    }
    setEnviando(true);
    try {
      await api.post('/citas', form);
      setAviso({ ok: 'Cita registrada y confirmación enviada.' });
      setForm((f) => ({ ...f, hora: '', motivo: '' }));
      setVersionAgenda((v) => v + 1); // la hora reservada deja de figurar como libre
      await cargar();
    } catch (err) {
      const alternativas = err.response?.data?.alternativas;
      setAviso({ error: mensajeError(err) + (alternativas?.length ? ` Libres: ${alternativas.join(', ')}` : '') });
    } finally {
      setEnviando(false);
    }
  };

  const accion = async (cita, ruta, cuerpo, ok) => {
    try {
      const { data } = await api.post(`/citas/${cita.id}/${ruta}`, cuerpo);
      setAviso({ ok: ok + (data.cupo_ofrecido_a ? ` Cupo ofrecido a ${data.cupo_ofrecido_a}.` : '') });
      if (ruta === 'cancelar') setVersionAgenda((v) => v + 1); // el horario vuelve a quedar libre
      await cargar();
      return true;
    } catch (err) {
      setAviso({ error: mensajeError(err) });
      return false;
    }
  };

  const abrirCobro = (cita) => setCobro({ cita, monto: '80', comprobante: comprobanteSugerido(cita), metodo: 'yape' });
  const cambiarCobro = (e) => setCobro((c) => ({ ...c, [e.target.name]: e.target.value }));

  const registrarPago = async (e) => {
    e.preventDefault();
    const monto = Number(cobro.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      setAviso({ error: 'Ingresa un monto mayor que cero.' });
      return;
    }
    if (!cobro.comprobante.trim()) {
      setAviso({ error: 'Ingresa el número de comprobante.' });
      return;
    }
    setEnviando(true);
    const pagado = await accion(
      cobro.cita,
      'cobrar',
      { monto, comprobante_numero: cobro.comprobante.trim(), metodo_pago: cobro.metodo },
      'Pago registrado.',
    );
    setEnviando(false);
    if (pagado) setCobro(null);
  };

  const paciente = (c) => `${c.paciente?.nombres ?? ''} ${c.paciente?.apellidos ?? ''}`.trim();

  return (
    <>
      <header className="cabecera">
        <h1>Citas y agenda</h1>
        <p>Agenda, cobro y atención de las citas del centro.</p>
      </header>
      <Aviso>{aviso.ok}</Aviso><Aviso tipo="error">{aviso.error}</Aviso>
      <div className="rejilla">
        <section className="tarjeta">
          <h2>Próximas citas</h2>
          <Tabla
            filas={citas}
            vacio="Aún no hay citas registradas."
            columnas={[
              { titulo: 'Fecha', valor: (c) => `${c.fecha} ${c.hora}` },
              { titulo: 'Paciente', valor: paciente },
              { titulo: 'Psicólogo', valor: (c) => c.psicologo?.name },
              { titulo: 'Estado', valor: (c) => <span className={`estado estado--${c.estado}`}>{ESTADOS[c.estado]}</span> },
              {
                titulo: 'Acciones',
                valor: (c) => (
                  <div className="acciones">
                    {esRecepcion && !c.pagado && c.estado === 'pendiente' && <button type="button" className="btn btn--mini" onClick={() => abrirCobro(c)}>Cobrar</button>}
                    {esPsicologo && c.estado === 'confirmada' && <button type="button" className="btn btn--mini" onClick={() => accion(c, 'atender', {}, 'Cita atendida.')}>Atender</button>}
                    {esRecepcion && ['pendiente', 'confirmada'].includes(c.estado) && <button type="button" className="btn btn--mini btn--peligro" onClick={() => accion(c, 'cancelar', {}, 'Cita cancelada.')}>Cancelar</button>}
                  </div>
                ),
              },
            ]}
          />
        </section>
        {esRecepcion && (
          <div className="columna">
            {cobro && (
              <form className="tarjeta formulario tarjeta--destacada" onSubmit={registrarPago} aria-label="Registrar pago">
                <h2>Registrar pago</h2>
                <p className="ayuda">{paciente(cobro.cita)} · {cobro.cita.fecha} {cobro.cita.hora}</p>
                <Campo label="Monto (S/)" nombre="monto" type="number" min="0.01" step="0.01" inputMode="decimal" value={cobro.monto} onChange={cambiarCobro} required />
                <Campo label="N.º de comprobante" nombre="comprobante" value={cobro.comprobante} onChange={cambiarCobro} required />
                <Campo as="select" label="Método de pago" nombre="metodo" value={cobro.metodo} onChange={cambiarCobro}>
                  {Object.entries(METODOS_PAGO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Campo>
                <div className="acciones">
                  <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Registrando…' : 'Registrar pago'}</button>
                  <button type="button" className="btn btn--fantasma" onClick={() => setCobro(null)}>Cancelar</button>
                </div>
              </form>
            )}
            <form className="tarjeta formulario" onSubmit={agendar}>
              <h2>Nueva cita</h2>
              <Campo as="select" label="Paciente" nombre="paciente_id" value={form.paciente_id} onChange={cambiar} required>
                <option value="">Selecciona…</option>
                {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
              </Campo>
              <Campo as="select" label="Psicólogo" nombre="psicologo_id" value={form.psicologo_id} onChange={cambiar} required>
                <option value="">Selecciona…</option>
                {psicologos.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.especialidad}</option>)}
              </Campo>
              <Campo label="Fecha" nombre="fecha" type="date" min={manana()} value={form.fecha} onChange={cambiar} required />
              <fieldset className="horas">
                <legend>Horas libres</legend>
                {libres.length === 0 && <small>Elige psicólogo y fecha para ver horarios libres.</small>}
                {libres.map((h) => (
                  <button
                    type="button"
                    key={h}
                    className={`hora ${form.hora === h ? 'hora--activa' : ''}`}
                    aria-pressed={form.hora === h}
                    onClick={() => setForm((f) => ({ ...f, hora: h }))}
                  >
                    {h}
                  </button>
                ))}
              </fieldset>
              <Campo label="Motivo" nombre="motivo" value={form.motivo} onChange={cambiar} required />
              <button type="submit" className="btn" disabled={!form.hora || enviando}>{enviando ? 'Agendando…' : 'Agendar'}</button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
