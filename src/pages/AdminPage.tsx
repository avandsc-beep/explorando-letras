import { useEffect, useState } from 'react'
import { supabase, type Registro } from '../lib/supabase'
import { CampanasPage } from './CampanasPage'

interface RegistroConAutor extends Registro {
  autor_nombre?: string
  campana_nombre?: string
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

interface GrupoRevision {
  clave: string
  informeId: string | null
  autorNombre: string
  campanaNombre: string | null
  registros: RegistroConAutor[]
}

export function AdminPage() {
  const [seccion, setSeccion] = useState<'revision' | 'campanas'>('revision')
  const [registros, setRegistros] = useState<RegistroConAutor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [notas, setNotas] = useState<Record<string, string>>({})
  const [filtroEstado, setFiltroEstado] = useState<'pendientes' | 'validados' | 'rechazados'>('pendientes')

  async function cargar() {
    setCargando(true)
    setError(null)

    let query = supabase.from('registros').select('*')

    if (filtroEstado === 'pendientes') {
      // Piezas personales completas (van directo a revisión) O piezas de
      // investigación que ya fueron entregadas en un informe (informe_id
      // presente) O piezas ya marcadas explícitamente pendiente_revision.
      query = query.or(
        'estado.eq.pendiente_revision,and(estado.eq.completa,origen.eq.personal),and(estado.eq.completa,informe_id.not.is.null)',
      )
    } else if (filtroEstado === 'validados') {
      query = query.eq('estado', 'validada')
    } else {
      query = query.eq('estado', 'rechazada')
    }

    const { data, error: err } = await query.order('fecha_registro', { ascending: false })

    if (err) {
      setError('No se pudieron cargar los registros: ' + err.message)
      setCargando(false)
      return
    }

    const regs = (data as Registro[]) ?? []
    const idsUnicos = [...new Set(regs.map((r) => r.usuario_id))]
    const idsCampanas = [...new Set(regs.map((r) => r.campana_id).filter(Boolean))] as string[]

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

    let mapaCampanas: Record<string, string> = {}
    if (idsCampanas.length > 0) {
      const { data: campanas } = await supabase.from('campanas').select('id, nombre').in('id', idsCampanas)
      for (const c of (campanas as { id: string; nombre: string }[]) ?? []) {
        mapaCampanas[c.id] = c.nombre
      }
    }

    setRegistros(
      regs.map((r) => ({
        ...r,
        autor_nombre: mapaNombres[r.usuario_id] ?? 'Desconocido',
        campana_nombre: r.campana_id ? mapaCampanas[r.campana_id] : undefined,
      })),
    )
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

  // Agrupar por informe (piezas de investigación entregadas juntas);
  // las piezas personales quedan cada una en su propio "grupo" de 1.
  const grupos: GrupoRevision[] = []
  for (const r of registros) {
    const clave = r.informe_id ?? `individual-${r.id}`
    let grupo = grupos.find((g) => g.clave === clave)
    if (!grupo) {
      grupo = {
        clave,
        informeId: r.informe_id,
        autorNombre: r.autor_nombre ?? 'Desconocido',
        campanaNombre: r.campana_nombre ?? null,
        registros: [],
      }
      grupos.push(grupo)
    }
    grupo.registros.push(r)
  }

  function tarjetaRegistro(r: RegistroConAutor) {
    return (
      <div key={r.id} className="el-card el-admin-item" style={{ marginBottom: 10 }}>
        {r.foto_url && <img src={r.foto_url} alt="" className="el-admin-foto" />}
        <div className="el-admin-datos">
          <span className={`el-badge el-badge-${r.estado}`}>{r.estado.replace('_', ' ')}</span>
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
    )
  }

  return (
    <div className="el-main" style={{ paddingBottom: 90 }}>
      <h1 className="el-title">Panel admin</h1>

      <div className="el-admin-tabs" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className={`el-admin-tab ${seccion === 'revision' ? 'el-admin-tab-activo' : ''}`}
          onClick={() => setSeccion('revision')}
        >
          Revisión
        </button>
        <button
          type="button"
          className={`el-admin-tab ${seccion === 'campanas' ? 'el-admin-tab-activo' : ''}`}
          onClick={() => setSeccion('campanas')}
        >
          Campañas
        </button>
      </div>

      {seccion === 'campanas' ? (
        <CampanasPage />
      ) : (
        <>
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
          ) : grupos.length === 0 ? (
            <p className="el-hint">No hay registros en esta categoría.</p>
          ) : (
            grupos.map((g) => (
              <div key={g.clave} style={{ marginBottom: 20 }}>
                {g.informeId && (
                  <div
                    style={{
                      background: 'var(--ink-soft)',
                      border: '1px solid var(--ochre)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      marginBottom: 8,
                      fontSize: 14,
                    }}
                  >
                    📋 Informe de <strong>{g.autorNombre}</strong>
                    {g.campanaNombre ? ` — ${g.campanaNombre}` : ''} · {g.registros.length} pieza
                    {g.registros.length === 1 ? '' : 's'}
                  </div>
                )}
                {!g.informeId && (
                  <p className="el-hint" style={{ marginBottom: 6 }}>
                    Autor: {g.autorNombre}
                  </p>
                )}
                {g.registros.map(tarjetaRegistro)}
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
