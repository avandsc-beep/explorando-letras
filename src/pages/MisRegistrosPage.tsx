import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type Registro } from '../lib/supabase'
import { UnirseEquipo } from '../components/UnirseEquipo'

const ETIQUETAS_ESTADO: Record<Registro['estado'], string> = {
  borrador: 'Borrador (sin terminar)',
  completa: 'Completo, esperando revisión',
  pendiente_revision: 'En revisión',
  validada: 'Validado — visible en el mapa',
  rechazada: 'Rechazado',
}

export function MisRegistrosPage() {
  const { user } = useAuth()
  const [registros, setRegistros] = useState<Registro[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    if (!user) return
    setCargando(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('registros')
      .select('*')
      .eq('usuario_id', user.id)
      .order('fecha_registro', { ascending: false })

    if (err) {
      setError('No se pudieron cargar tus registros: ' + err.message)
    } else {
      setRegistros((data as Registro[]) ?? [])
    }
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <div className="el-main" style={{ paddingBottom: 90 }}>
      <h1 className="el-title">Mis registros</h1>
      <p className="el-subtitle">
        Acá vas a ver siempre lo que registraste y en qué estado está — te confirma que se guardó
        correctamente.
      </p>

      <UnirseEquipo />

      {error && <div className="el-error">{error}</div>}

      {cargando ? (
        <p className="el-hint">Cargando…</p>
      ) : registros.length === 0 ? (
        <p className="el-hint">Todavía no registraste ninguna pieza. Tocá "Registrar" para empezar.</p>
      ) : (
        registros.map((r) => (
          <div key={r.id} className="el-card el-admin-item" style={{ marginBottom: 10 }}>
            {r.foto_url && <img src={r.foto_url} alt="" className="el-admin-foto" />}
            <div className="el-admin-datos">
              <span className={`el-badge el-badge-${r.estado}`}>{r.estado.replace('_', ' ')}</span>
              <p className="el-admin-linea" style={{ marginTop: 6 }}>
                {ETIQUETAS_ESTADO[r.estado]}
              </p>
              <p className="el-admin-linea">
                {r.ciudad} {r.direccion_calle ? `· ${r.direccion_calle}` : ''}
              </p>
              <p className="el-hint">{new Date(r.fecha_registro).toLocaleString('es-BO')}</p>
              {r.estado === 'rechazada' && r.notas_admin && (
                <p className="el-admin-linea" style={{ color: 'var(--brick)' }}>
                  <strong>Por qué:</strong> {r.notas_admin}
                </p>
              )}
              {r.estado === 'borrador' && (
                <p className="el-admin-linea" style={{ color: 'var(--ochre)' }}>
                  Falta completar la ficha de clasificación para que se pueda revisar.
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
