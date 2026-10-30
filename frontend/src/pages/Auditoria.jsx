import { useEffect, useState } from 'react';
import { obtener } from '../services/api';
import Aviso from '../components/Aviso';
import Tabla from '../components/Tabla';

export default function Auditoria() {
  const [lista, setLista] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      const { data, error: fallo } = await obtener('/auditoria');
      if (fallo) setError(fallo);
      else setLista(data.data);
    };
    void cargar();
  }, []);

  return (
    <>
      <header className="cabecera"><h1>Auditoría</h1><p>Registro de acciones críticas (ISO/IEC 27001).</p></header>
      <Aviso tipo="error">{error}</Aviso>
      <section className="tarjeta">
        <Tabla filas={lista} vacio="Aún no hay acciones registradas." columnas={[
          { titulo: 'Fecha', valor: (a) => a.created_at?.replace('T', ' ').slice(0, 19) },
          { titulo: 'Usuario', valor: (a) => a.usuario?.name || 'Sistema' },
          { titulo: 'Acción', valor: (a) => <code>{a.accion}</code> },
          { titulo: 'Entidad', valor: (a) => (a.entidad ? `${a.entidad} #${a.entidad_id}` : 'General') },
          { titulo: 'IP', valor: (a) => a.ip },
        ]} />
      </section>
    </>
  );
}
