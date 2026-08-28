import { useEffect, useState } from 'react'
import { supabase, type Registro } from '../lib/supabase'

interface RegistroConAutor extends Registro {
  autor_nombre?: string
}

function generarIdUnico(ciudad: string): string {
  const codigoCiudad = ciudad
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'XX'
  const anio = new Date().getFullYear()
  const sufijo = Math.floor(Math.random() * 9000 + 1000)
  return `EL-${codigoCiudad}-${anio}-${sufijo}`
}

export function AdminPage() {
  const [registros, setRegistros] = useState<RegistroConAutor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [notas, setNotas] = useState<Record<string, string>>({})
  const [filtroEstado, setFiltroEstado] = useState<'pendientes' | 'validados' | 'rechazados'>('pendientes')

  async function cargar() {
    setCargando(true)
    setError(null)

    const estadosPorFiltro = {
      pendientes: ['completa', 'pendiente_revision'],
      validados: ['validada'],
      rechazados: ['rechazada'],
    }

    const { data, error: err } = await supabase
      .from('registros')
      .select('*')
      .in('estado', estadosPorFiltro[filtroEstado])
      .order('fecha_registro', { ascending: false })

    if (err) {
      setError('No se pudieron cargar los registros: ' + err.message)
      setCargando(false)
      return
    }

    const regs = (data as Registro[]) ?? []
    const idsUnicos = [...new Set(regs.map((r) => r.usuario_id))]
    let mapaNombres: Record<string, string> = {}

    if (idsUnicos.length > 0) {
      const { data: perfiles } = await supabase
        .from('perfiles')
        .select('id, nombre_publico')
        .in('id', idsUnicos)
      for (const p of (perfiles as { id: string; nombre_publico: string }[]) ?? []) {
        mapaNombres[p.id] = p.nombre_publico
      }
    }

    setRegistros(regs.map((r) => ({ ...r, autor_nombre: mapaNombres[r.usuario_id] ?? 'Desconocido' })))
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado])

  async function aprobar(r: RegistroConAutor) {
    setProcesando(r.id)
    const { error: err } = await supabase
      .from('registros')
      .update({
        estado: 'validada',
        id_unico: r.id_unico ?? generarIdUnico(r.ciudad),
        fecha_validacion: new Date().toISOString(),
        notas_admin: notas[r.id] || null,
      })
      .eq('id', r.id)

    if (err) {
      setError('No se pudo aprobar: ' + err.message)
    } else {
      setRegistros((prev) => prev.filter((x) => x.id !== r.id))
    }
    setProcesando(null)
  }

  async function rechazar(r: RegistroConAutor) {
    if (!notas[r.id]?.trim()) {
      setError('Agregá una observación antes de rechazar, para que el autor sepa qué corregir.')
      return
    }
    setProcesando(r.id)
    const { error: err } = await supabase
      .from('registros')
      .update({
        estado: 'rechazada',
        notas_admin: notas[r.id],
      })
      .eq('id', r.id)

    if (err) {
      setError('No se pudo rechazar: ' + err.message)
    } else {
      setRegistros((prev) => prev.filter((x) => x.id !== r.id))
    }
    setProcesando(null)
  }

  return (
    <div className="el-main" style={{ paddingBottom: 90 }}>
      <h1 className="el-title">Panel admin</h1>
      <p className="el-subtitle">Revisá y validá los registros antes de que aparezcan en el mapa público.</p>

      <div className="el-admin-tabs">
        <button
          type="button"
          className={`el-admin-tab ${filtroEstado === 'pendientes' ? 'el-admin-tab-activo' : ''}`}
          onClick={() => setFiltroEstado('pendientes')}
        >
          Pendientes
        </button>
        <button
          type="button"
          className={`el-admin-tab ${filtroEstado === 'validados' ? 'el-admin-tab-activo' : ''}`}
          onClick={() => setFiltroEstado('validados')}
        >
          Validados
        </button>
        <button
          type="button"
          className={`el-admin-tab ${filtroEstado === 'rechazados' ? 'el-admin-tab-activo' : ''}`}
          onClick={() => setFiltroEstado('rechazados')}
        >
          Rechazados
        </button>
      </div>

      {error && <div className="el-error">{error}</div>}

      {cargando ? (
        <p className="el-hint">Cargando…</p>
      ) : registros.length === 0 ? (
        <p className="el-hint">No hay registros en esta categoría.</p>
      ) : (
        registros.map((r) => (
          <div key={r.id} className="el-card el-admin-item">
            {r.foto_url && <img src={r.foto_url} alt="" className="el-admin-foto" />}
            <div className="el-admin-datos">
              <span className={`el-badge el-badge-${r.estado}`}>{r.estado.replace('_', ' ')}</span>
              <p className="el-admin-linea">
                <strong>Autor:</strong> {r.autor_nombre}
              </p>
              <p className="el-admin-linea">
                <strong>Ciudad:</strong> {r.ciudad} {r.direccion_calle ? `· ${r.direccion_calle}` : ''}
              </p>
              <p className="el-admin-linea">
                <strong>Técnica:</strong> {r.tecnica || '—'} &nbsp; <strong>Soporte:</strong> {r.soporte || '—'}
              </p>
              <p className="el-admin-linea">
                <strong>Función:</strong> {r.funcion || '—'} &nbsp; <strong>Estado:</strong>{' '}
                {r.estado_conservacion || '—'}
              </p>
              {r.texto_principal && (
                <p className="el-admin-linea">
                  <strong>Texto:</strong> "{r.texto_principal}"
                </p>
              )}
              {r.notas_admin && (
                <p className="el-admin-linea" style={{ color: 'var(--brick)' }}>
                  <strong>Observación previa:</strong> {r.notas_admin}
                </p>
              )}

              {filtroEstado === 'pendientes' && (
                <>
                  <textarea
                    className="el-textarea"
                    placeholder="Observación (obligatoria solo si vas a rechazar)"
                    value={notas[r.id] ?? ''}
                    onChange={(e) => setNotas({ ...notas, [r.id]: e.target.value })}
                    style={{ marginTop: 10, minHeight: 50 }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      className="el-btn el-btn-danger"
                      disabled={procesando === r.id}
                      onClick={() => rechazar(r)}
                    >
                      Rechazar
                    </button>
                    <button
                      type="button"
                      className="el-btn el-btn-primary"
                      disabled={procesando === r.id}
                      onClick={() => aprobar(r)}
                    >
                      {procesando === r.id ? 'Guardando…' : 'Aprobar'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
