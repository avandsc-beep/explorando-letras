import { useEffect, useState } from 'react'
import { supabase, type Registro, type Lexico } from '../lib/supabase'

interface Filtros {
  ciudad: string
  tecnica: string
  soporte: string
  funcion: string
}

type Agrupacion = 'ninguna' | 'tecnica' | 'funcion' | 'campana'

const FILTROS_VACIOS: Filtros = { ciudad: '', tecnica: '', soporte: '', funcion: '' }

interface RegistroConDatos extends Registro {
  autor_nombre?: string
  campana_nombre?: string
}

export function GaleriaPage() {
  const [registros, setRegistros] = useState<RegistroConDatos[]>([])
  const [lexicos, setLexicos] = useState<Lexico[]>([])
  const [ciudadesDisponibles, setCiudadesDisponibles] = useState<string[]>([])
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS)
  const [agrupacion, setAgrupacion] = useState<Agrupacion>('ninguna')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [piezaSeleccionada, setPiezaSeleccionada] = useState<RegistroConDatos | null>(null)

  useEffect(() => {
    supabase
      .from('lexicos')
      .select('*')
      .eq('activo', true)
      .then(({ data }) => setLexicos((data as Lexico[]) ?? []))

    supabase
      .from('registros')
      .select('ciudad')
      .eq('estado', 'validada')
      .then(({ data }) => {
        const unicas = [...new Set((data as { ciudad: string }[] ?? []).map((r) => r.ciudad))]
        setCiudadesDisponibles(unicas)
      })
  }, [])

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros])

  async function cargar() {
    setCargando(true)
    setError(null)

    let query = supabase.from('registros').select('*').eq('estado', 'validada')
    if (filtros.ciudad) query = query.eq('ciudad', filtros.ciudad)
    if (filtros.tecnica) query = query.eq('tecnica', filtros.tecnica)
    if (filtros.soporte) query = query.eq('soporte', filtros.soporte)
    if (filtros.funcion) query = query.eq('funcion', filtros.funcion)

    const { data, error: err } = await query.order('fecha_registro', { ascending: false })

    if (err) {
      setError('No se pudieron cargar las piezas: ' + err.message)
      setCargando(false)
      return
    }

    const regs = (data as Registro[]) ?? []

    const idsUsuarios = [...new Set(regs.map((r) => r.usuario_id))]
    const idsCampanas = [...new Set(regs.map((r) => r.campana_id).filter(Boolean))] as string[]

    let mapaAutores: Record<string, string> = {}
    if (idsUsuarios.length > 0) {
      const { data: perfiles } = await supabase.from('perfiles').select('id, nombre_publico').in('id', idsUsuarios)
      for (const p of (perfiles as { id: string; nombre_publico: string }[]) ?? []) {
        mapaAutores[p.id] = p.nombre_publico
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
        autor_nombre: mapaAutores[r.usuario_id] ?? 'Alguien',
        campana_nombre: r.campana_id ? mapaCampanas[r.campana_id] : undefined,
      })),
    )
    setCargando(false)
  }

  function opciones(categoria: Lexico['categoria']) {
    return [...new Set(lexicos.filter((l) => l.categoria === categoria).map((l) => l.valor))]
  }

  function claveDeGrupo(r: RegistroConDatos): string {
    if (agrupacion === 'tecnica') return r.tecnica || 'Sin técnica registrada'
    if (agrupacion === 'funcion') return r.funcion || 'Sin función registrada'
    if (agrupacion === 'campana') return r.campana_nombre || 'Aporte personal (sin campaña)'
    return ''
  }

  const grupos: { titulo: string; items: RegistroConDatos[] }[] = []
  if (agrupacion === 'ninguna') {
    grupos.push({ titulo: '', items: registros })
  } else {
    for (const r of registros) {
      const clave = claveDeGrupo(r)
      let grupo = grupos.find((g) => g.titulo === clave)
      if (!grupo) {
        grupo = { titulo: clave, items: [] }
        grupos.push(grupo)
      }
      grupo.items.push(r)
    }
    grupos.sort((a, b) => a.titulo.localeCompare(b.titulo))
  }

  return (
    <div className="el-main" style={{ paddingBottom: 90 }}>
      <p style={{ fontSize: 14, color: 'var(--paper-dim)', marginBottom: 14 }}>
        Todas las piezas confirmadas del archivo, en un catálogo para mirar y explorar. Tocá cualquier
        foto para ver todos sus datos.
      </p>

      <div className="el-mapa-filtros" style={{ padding: 0, marginBottom: 12, background: 'none', border: 'none' }}>
        <select
          className="el-select el-select-compacto"
          value={filtros.ciudad}
          onChange={(e) => setFiltros({ ...filtros, ciudad: e.target.value })}
        >
          <option value="">Todas las ciudades</option>
          {ciudadesDisponibles.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="el-select el-select-compacto"
          value={filtros.tecnica}
          onChange={(e) => setFiltros({ ...filtros, tecnica: e.target.value })}
        >
          <option value="">Todas las técnicas</option>
          {opciones('tecnica').map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select
          className="el-select el-select-compacto"
          value={filtros.soporte}
          onChange={(e) => setFiltros({ ...filtros, soporte: e.target.value })}
        >
          <option value="">Todos los soportes</option>
          {opciones('soporte').map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select
          className="el-select el-select-compacto"
          value={filtros.funcion}
          onChange={(e) => setFiltros({ ...filtros, funcion: e.target.value })}
        >
          <option value="">Todas las funciones</option>
          {opciones('funcion').map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className="el-field" style={{ marginBottom: 16 }}>
        <label className="el-label">Ordenar el catálogo por</label>
        <select className="el-select" value={agrupacion} onChange={(e) => setAgrupacion(e.target.value as Agrupacion)}>
          <option value="ninguna">Más recientes primero</option>
          <option value="tecnica">Agrupar por técnica</option>
          <option value="funcion">Agrupar por función</option>
          <option value="campana">Agrupar por campaña</option>
        </select>
      </div>

      {error && <div className="el-error">{error}</div>}

      {cargando ? (
        <p className="el-hint">Cargando…</p>
      ) : registros.length === 0 ? (
        <p className="el-hint">No hay piezas que coincidan con estos filtros.</p>
      ) : (
        grupos.map((g) => (
          <div key={g.titulo || 'todas'} style={{ marginBottom: 24 }}>
            {g.titulo && (
              <h2 className="el-title" style={{ fontSize: 18, marginBottom: 10 }}>
                {g.titulo} <span className="el-hint">({g.items.length})</span>
              </h2>
            )}
            <div className="el-galeria-grid">
              {g.items.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className="el-galeria-card"
                  onClick={() => setPiezaSeleccionada(r)}
                >
                  {r.foto_url ? (
                    <img src={r.foto_url} alt="" className="el-galeria-foto" />
                  ) : (
                    <div className="el-galeria-foto el-galeria-foto-vacia" />
                  )}
                  <div className="el-galeria-pie">
                    <span className="el-galeria-id">{r.id_unico ?? 'Sin ID'}</span>
                    <span className="el-galeria-detalle">{r.tecnica || '—'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {piezaSeleccionada && (
        <div className="el-modal-overlay" onClick={() => setPiezaSeleccionada(null)}>
          <div className="el-modal" onClick={(e) => e.stopPropagation()}>
            {piezaSeleccionada.foto_url && (
              <img src={piezaSeleccionada.foto_url} alt="" className="el-modal-foto" />
            )}
            <div style={{ padding: 18 }}>
              <p style={{ fontWeight: 700, fontSize: 18, margin: '0 0 4px' }}>
                {piezaSeleccionada.id_unico ?? 'Pieza sin ID'}
              </p>
              <p className="el-hint" style={{ marginBottom: 12 }}>
                Registrado por {piezaSeleccionada.autor_nombre}
                {piezaSeleccionada.campana_nombre ? ` · ${piezaSeleccionada.campana_nombre}` : ''}
              </p>

              <p className="el-admin-linea">
                <strong>Ciudad:</strong> {piezaSeleccionada.ciudad}
                {piezaSeleccionada.direccion_calle ? ` · ${piezaSeleccionada.direccion_calle}` : ''}
              </p>
              {piezaSeleccionada.referencia && (
                <p className="el-admin-linea">
                  <strong>Referencia:</strong> {piezaSeleccionada.referencia}
                </p>
              )}
              <p className="el-admin-linea">
                <strong>Soporte:</strong> {piezaSeleccionada.soporte || '—'}
              </p>
              <p className="el-admin-linea">
                <strong>Técnica:</strong> {piezaSeleccionada.tecnica || '—'}
              </p>
              <p className="el-admin-linea">
                <strong>Función:</strong> {piezaSeleccionada.funcion || '—'}
              </p>
              <p className="el-admin-linea">
                <strong>Estado de conservación:</strong> {piezaSeleccionada.estado_conservacion || '—'}
              </p>
              {piezaSeleccionada.presencia_serifas && (
                <p className="el-admin-linea">
                  <strong>Serifas:</strong> {piezaSeleccionada.presencia_serifas}
                </p>
              )}
              {piezaSeleccionada.grosor_trazo && (
                <p className="el-admin-linea">
                  <strong>Grosor de trazo:</strong> {piezaSeleccionada.grosor_trazo}
                </p>
              )}
              {piezaSeleccionada.estilo_general && (
                <p className="el-admin-linea">
                  <strong>Estilo:</strong> {piezaSeleccionada.estilo_general}
                </p>
              )}
              {piezaSeleccionada.texto_principal && (
                <p className="el-admin-linea">
                  <strong>Texto:</strong> "{piezaSeleccionada.texto_principal}"
                </p>
              )}

              <button
                type="button"
                className="el-btn el-btn-ghost"
                style={{ marginTop: 14 }}
                onClick={() => setPiezaSeleccionada(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
