import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError, obtener } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Campo from '../components/Campo';
import Tabla from '../components/Tabla';
import Aviso from '../components/Aviso';
import BotonPdf from '../components/BotonPdf';
import { validarPaciente } from '../utils/validaciones';

const VACIO = { nombres: '', apellidos: '', dni: '', telefono: '', email: '', fecha_nacimiento: '' };

export default function Pacientes() {
  const { usuario } = useAuth();
  const puedeEditar = ['admin', 'recepcionista'].includes(usuario.role);
  const [lista, setLista] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState({});
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async (termino) => {
    const { data, error } = await obtener('/pacientes', { params: { buscar: termino } });
    if (error) setAviso({ error });
    else setLista(data.data);
  }, []);

  // Busca 300 ms después de la última tecla, en lugar de una petición por letra.
  useEffect(() => {
    const espera = setTimeout(() => { void cargar(buscar); }, 300);
    return () => clearTimeout(espera);
  }, [buscar, cargar]);

  const guardar = async (e) => {
    e.preventDefault();
    const encontrados = validarPaciente(form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      const limpio = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await api.post('/pacientes', limpio);
      setForm(VACIO);
      setAviso({ ok: 'Paciente registrado.' });
      await cargar(buscar);
    } catch (err) {
      setAviso({ error: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <>
      <header className="cabecera cabecera--acciones">
        <div><h1>Pacientes</h1><p>Busca y registra a los pacientes del centro.</p></div>
        <BotonPdf tipo="pacientes" onError={(error) => setAviso({ error })} />
      </header>
      <Aviso>{aviso.ok}</Aviso><Aviso tipo="error">{aviso.error}</Aviso>
      <div className="rejilla">
        <section className="tarjeta">
          <input type="search" className="buscador" placeholder="Buscar por nombre, apellido o DNI" aria-label="Buscar pacientes" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
          <Tabla
            vacio={buscar ? 'No hay pacientes que coincidan con la búsqueda.' : 'Aún no hay pacientes registrados.'}
            filas={lista}
            columnas={[
              { titulo: 'Paciente', valor: (p) => p.nombre_completo },
              { titulo: 'DNI', valor: (p) => p.dni },
              { titulo: 'Teléfono', valor: (p) => p.telefono || 'Sin registrar' },
            ]}
          />
        </section>
        {puedeEditar && (
          <form className="tarjeta formulario" onSubmit={guardar} noValidate>
            <h2>Nuevo paciente</h2>
            <Campo label="Nombres" nombre="nombres" value={form.nombres} onChange={cambiar} error={errores.nombres} />
            <Campo label="Apellidos" nombre="apellidos" value={form.apellidos} onChange={cambiar} error={errores.apellidos} />
            <Campo label="DNI" nombre="dni" inputMode="numeric" maxLength={8} value={form.dni} onChange={cambiar} error={errores.dni} />
            <Campo label="Celular" nombre="telefono" type="tel" inputMode="tel" value={form.telefono} onChange={cambiar} error={errores.telefono} />
            <Campo label="Correo" nombre="email" type="email" value={form.email} onChange={cambiar} />
            <Campo label="Fecha de nacimiento" nombre="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={cambiar} />
            <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Registrando…' : 'Registrar'}</button>
          </form>
        )}
      </div>
    </>
  );
}
