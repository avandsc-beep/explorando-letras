import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Campana {
  id: string
  nombre: string
  ciudad: string
  anio: number
}

interface Equipo {
  id: string
  nombre: string
}

interface Miembro {
  usuario_id: string
  nombre: string
}

interface ConteosPorEstado {
  borrador: number
  completaSinEntregar: number
  entregadaEsperandoRevision: number
  validada: number
  rechazada: number
}

const CONTEO_VACIO: ConteosPorEstado = {
  borrador: 0,
  completaSinEntregar: 0,
  entregadaEsperandoRevision: 0,
  validada: 0,
  rechazada: 0,
}

export function ProgresoPanel() {
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [campanaId, setCampanaId] = useState('')
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [miembrosPorEquipo, setMiembrosPorEquipo] = useState<Record<string, Miembro[]>>({})
  const [conteosPorUsuario, setConteosPorUsuario] = useState<Record<string, ConteosPorEstado>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('campanas')
      .select('id, nombre, ciudad, anio')
      .order('anio', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          setError('No se pudieron cargar las campañas: ' + err.message)
          return
        }
        const lista = (data as Campana[]) ?? []
        setCampanas(lista)
        if (lista.length > 0) setCampanaId(lista[0].id)
      })
  }, [])

  useEffect(() => {
    if (!campanaId) return
    cargarProgreso(campanaId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campanaId])

  async function cargarProgreso(id: string) {
    setCargando(true)
    setError(null)

    const { data: eq, error: errEq } = await supabase
      .from('equipos')
      .select('id, nombre')
      .eq('campana_id', id)
      .order('nombre')

    if (errEq) {
      setError('No se pudieron cargar los equipos: ' + errEq.message)
      setCargando(false)
      return
    }

    const listaEquipos = (eq as Equipo[]) ?? []
    setEquipos(listaEquipos)

    if (listaEquipos.length === 0) {
      setMiembrosPorEquipo({})
      setConteosPorUsuario({})
      setCargando(false)
      return
    }

    const equipoIds = listaEquipos.map((e) => e.id)

    const { data: miembros, error: errMiembros } = await supabase
      .from('equipo_miembros')
      .select('equipo_id, usuario_id, perfiles(nombre_publico)')
      .in('equipo_id', equipoIds)

    if (errMiembros) {
      setError('No se pudieron cargar los miembros: ' + errMiembros.message)
      setCargando(false)
      return
    }

    const mapaMiembros: Record<string, Miembro[]> = {}
    for (const m of miembros as unknown as {
      equipo_id: string
      usuario_id: string
      perfiles: { nombre_publico: string } | null
    }[]) {
      const nombre = m.perfiles?.nombre_publico ?? 'Desconocido'
      mapaMiembros[m.equipo_id] = [...(mapaMiembros[m.equipo_id] ?? []), { usuario_id: m.usuario_id, nombre }]
    }
    setMiembrosPorEquipo(mapaMiembros)

    const { data: registros, error: errRegistros } = await supabase
      .from('registros')
      .select('usuario_id, estado, informe_id')
      .eq('campana_id', id)
      .eq('origen', 'investigacion')

    if (errRegistros) {
      setError('No se pudieron cargar los registros: ' + errRegistros.message)
      setCargando(false)
      return
    }

    const conteos: Record<string, ConteosPorEstado> = {}
    for (const r of (registros as { usuario_id: string; estado: string; informe_id: string | null }[]) ?? []) {
      if (!conteos[r.usuario_id]) conteos[r.usuario_id] = { ...CONTEO_VACIO }
      const c = conteos[r.usuario_id]
      if (r.estado === 'borrador') c.borrador++
      else if (r.estado === 'completa' && !r.informe_id) c.completaSinEntregar++
      else if ((r.estado === 'completa' && r.informe_id) || r.estado === 'pendiente_revision')
        c.entregadaEsperandoRevision++
      else if (r.estado === 'validada') c.validada++
      else if (r.estado === 'rechazada') c.rechazada++
    }
    setConteosPorUsuario(conteos)
    setCargando(false)
  }

  return (
    <div>
      <div className="el-field">
        <label className="el-label">Campaña</label>
        <select className="el-select" value={campanaId} onChange={(e) => setCampanaId(e.target.value)}>
          {campanas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} ({c.ciudad}, {c.anio})
            </option>
          ))}
        </select>
      </div>

      {error && <div className="el-error">{error}</div>}

      {cargando ? (
        <p className="el-hint">Cargando…</p>
      ) : equipos.length === 0 ? (
        <p className="el-hint">Esta campaña todavía no tiene equipos.</p>
      ) : (
        equipos.map((eq) => {
          const miembros = miembrosPorEquipo[eq.id] ?? []
          return (
            <div key={eq.id} className="el-card" style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 10px' }}>{eq.nombre}</p>
              {miembros.length === 0 ? (
                <p className="el-hint">Todavía nadie se unió a este equipo.</p>
              ) : (
                miembros.map((m) => {
                  const c = conteosPorUsuario[m.usuario_id] ?? CONTEO_VACIO
                  const total = c.borrador + c.completaSinEntregar + c.entregadaEsperandoRevision + c.validada + c.rechazada
                  return (
                    <div
                      key={m.usuario_id}
                      style={{
                        borderTop: '1px solid var(--ink-line)',
                        padding: '10px 0',
                      }}
                    >
                      <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 6px' }}>
                        {m.nombre} <span className="el-hint">— {total} pieza{total === 1 ? '' : 's'} en total</span>
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {c.borrador > 0 && (
                          <span className="el-badge el-badge-borrador">{c.borrador} borrador{c.borrador === 1 ? '' : 'es'}</span>
                        )}
                        {c.completaSinEntregar > 0 && (
                          <span className="el-badge el-badge-completa">
                            {c.completaSinEntregar} completa{c.completaSinEntregar === 1 ? '' : 's'} sin entregar
                          </span>
                        )}
                        {c.entregadaEsperandoRevision > 0 && (
                          <span className="el-badge el-badge-pendiente_revision">
                            {c.entregadaEsperandoRevision} esperando tu revisión
                          </span>
                        )}
                        {c.validada > 0 && (
                          <span className="el-badge el-badge-validada">{c.validada} validada{c.validada === 1 ? '' : 's'}</span>
                        )}
                        {c.rechazada > 0 && (
                          <span className="el-badge el-badge-rechazada">{c.rechazada} rechazada{c.rechazada === 1 ? '' : 's'}</span>
                        )}
                        {total === 0 && <span className="el-hint">Todavía no registró ninguna pieza.</span>}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
