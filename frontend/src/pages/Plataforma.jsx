import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError, obtener } from '../services/api';
import Aviso from '../components/Aviso';
import Tabla from '../components/Tabla';
import { Indicador } from './Panel';
import { useAuth } from '../context/AuthContext';

export default function Plataforma() {
  const [centros, setCentros] = useState([]);
  const [m, setM] = useState(null);
  const [aviso, setAviso] = useState({});
  const { modoUnico } = useAuth();

  const cargar = useCallback(async () => {
    const [respCentros, respMetricas] = await Promise.all([obtener('/plataforma/centros'), obtener('/plataforma/metricas')]);
    const error = respCentros.error || respMetricas.error;
    if (error) setAviso({ error });
    if (respCentros.data) setCentros(respCentros.data);
    if (respMetricas.data) setM(respMetricas.data);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const alternar = async (c) => {
    const estado = c.estado === 'activo' ? 'suspendido' : 'activo';
    try {
      await api.patch(`/plataforma/centros/${c.id}/estado`, { estado });
      setAviso({ ok: `Centro ${c.nombre}: ${estado}.` });
      await cargar();
    } catch (err) {
      setAviso({ error: mensajeError(err) });
    }
  };

  return (
    <>
      <header className="cabecera"><h1>Centros suscritos</h1><p>Panel del proveedor SaaS.</p></header>
      <Aviso>{aviso.ok}</Aviso><Aviso tipo="error">{aviso.error}</Aviso>
      {m && (
        <div className="indicadores">
          <Indicador titulo="Centros" valor={m.centros} />
          <Indicador titulo="Activos" valor={m.activos} tono="salvia" />
          {!modoUnico && <Indicador titulo="MRR (USD)" valor={m.mrr} tono="acento" />}
        </div>
      )}
      <section className="tarjeta">
        <Tabla filas={centros} vacio="Aún no hay centros registrados." columnas={[
          { titulo: 'Centro', valor: (c) => c.nombre },
          ...(modoUnico ? [] : [{ titulo: 'Plan', valor: (c) => <span className={`chip chip--${c.plan.codigo}`}>{c.plan.nombre}</span> }]),
          { titulo: 'Usuarios', valor: (c) => c.usuarios_count },
          { titulo: 'Estado', valor: (c) => <button type="button" className={`btn btn--mini ${c.estado === 'activo' ? '' : 'btn--peligro'}`} onClick={() => alternar(c)} title={c.estado === 'activo' ? 'Clic para suspender' : 'Clic para activar'}>{c.estado}</button> },
        ]} />
      </section>
    </>
  );
}
