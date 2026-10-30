import { useEffect, useState } from 'react';
import { obtener } from '../services/api';
import Aviso from '../components/Aviso';
import BotonPdf from '../components/BotonPdf';
import { useAuth } from '../context/AuthContext';
import { formatoSoles } from '../utils/validaciones';

export function Indicador({ titulo, valor, tono = 'principal' }) {
  return (
    <div className={`indicador indicador--${tono}`}>
      <span>{titulo}</span>
      <strong data-testid={`indicador-${titulo}`}>{valor}</strong>
    </div>
  );
}

export default function Panel() {
  const { usuario } = useAuth();
  const [m, setM] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      const { data, error: fallo } = await obtener('/dashboard');
      if (fallo) setError(fallo);
      else setM(data);
    };
    void cargar();
  }, []);

  const estados = Object.entries(m?.citas_por_estado || {});
  const maximo = Math.max(1, ...estados.map(([, total]) => total));

  return (
    <>
      <header className="cabecera cabecera--acciones">
        <div>
          <h1>Hola, {usuario.name.split(' ')[0]}</h1>
          <p>Resumen de {usuario.centro?.nombre}</p>
        </div>
        {m && <BotonPdf tipo="panel" onError={setError} />}
      </header>
      <Aviso tipo="error">{error}</Aviso>
      {!m && !error && <p className="vacio">Cargando…</p>}
      {m && (
        <>
          <div className="indicadores">
            <Indicador titulo="Citas hoy" valor={m.citas_hoy} />
            <Indicador titulo="Pacientes" valor={m.pacientes} tono="salvia" />
            <Indicador titulo="Por cobrar" valor={m.citas_pendientes_pago} tono="acento" />
            <Indicador titulo="Ingresos del mes" valor={formatoSoles(m.ingresos_mes)} tono="salvia" />
            <Indicador titulo="En espera" valor={m.en_espera} tono="acento" />
            <Indicador titulo="Alertas clínicas" valor={m.alertas_evaluacion} tono="alerta" />
          </div>
          <section className="tarjeta">
            <h2>Citas por estado</h2>
            {estados.length === 0 && <p className="vacio">Aún no hay citas registradas.</p>}
            <div className="barras">
              {estados.map(([estado, total]) => (
                <div key={estado} className="barra">
                  <span>{estado.replaceAll('_', ' ')}</span>
                  <div><i style={{ width: `${(total / maximo) * 100}%` }} /></div>
                  <b>{total}</b>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
