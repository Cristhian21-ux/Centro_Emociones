import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError, obtener } from '../services/api';
import Tabla from '../components/Tabla';
import Campo from '../components/Campo';
import Aviso from '../components/Aviso';
import BotonPdf from '../components/BotonPdf';

const ROLES = { admin: 'Administración', recepcionista: 'Recepción', psicologo: 'Psicología' };
const VACIO = { name: '', email: '', role: 'psicologo', especialidad: '', password: '' };

export default function Personal() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [aviso, setAviso] = useState({});
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    const { data, error } = await obtener('/personal');
    if (error) setAviso({ error });
    else setLista(data);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const guardar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/personal', form);
      setAviso({ ok: 'Personal agregado.' });
      setForm(VACIO);
      await cargar();
    } catch (err) {
      setAviso({ error: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  const alternar = async (u) => {
    try {
      await api.patch(`/personal/${u.id}/activo`);
      await cargar();
    } catch (err) {
      setAviso({ error: mensajeError(err) });
    }
  };
  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <>
      <header className="cabecera cabecera--acciones">
        <div><h1>Personal</h1><p>Psicólogos, recepción y administración del centro.</p></div>
        <BotonPdf tipo="personal" onError={(error) => setAviso({ error })} />
      </header>
      <Aviso>{aviso.ok}</Aviso><Aviso tipo="error">{aviso.error}</Aviso>
      <div className="rejilla">
        <section className="tarjeta">
          <h2>Equipo del centro</h2>
          <Tabla filas={lista} vacio="Aún no hay personal registrado." columnas={[
            { titulo: 'Nombre', valor: (u) => u.name },
            { titulo: 'Rol', valor: (u) => ROLES[u.role] },
            { titulo: 'Especialidad', valor: (u) => u.especialidad || 'No aplica' },
            { titulo: 'Estado', valor: (u) => <button type="button" className={`btn btn--mini ${u.activo ? '' : 'btn--peligro'}`} onClick={() => alternar(u)} title={u.activo ? 'Clic para desactivar' : 'Clic para activar'}>{u.activo ? 'Activo' : 'Inactivo'}</button> },
          ]} />
        </section>
        <form className="tarjeta formulario" onSubmit={guardar}>
          <h2>Agregar personal</h2>
          <Campo label="Nombre" nombre="name" value={form.name} onChange={cambiar} required />
          <Campo label="Correo" nombre="email" type="email" value={form.email} onChange={cambiar} required />
          <Campo as="select" label="Rol" nombre="role" value={form.role} onChange={cambiar}>
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Campo>
          {form.role === 'psicologo' && <Campo label="Especialidad" nombre="especialidad" value={form.especialidad} onChange={cambiar} required />}
          <Campo label="Contraseña inicial" nombre="password" type="password" autoComplete="new-password" value={form.password} onChange={cambiar} required />
          <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Agregando…' : 'Agregar'}</button>
        </form>
      </div>
    </>
  );
}
