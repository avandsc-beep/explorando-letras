import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Espacio {
  id: string
  campana_id: string
  nombre: string
}

interface Equipo {
  id: string
  campana_id: string
  nombre: string
  codigo_invitacion: string
}

interface Props {
  campanaId: string
  espacios: Espacio[]
}

function generarCodigo(): string {
  // Código corto, fácil de tipear a mano: 6 caracteres, sin ambigüedades (sin 0/O, 1/I)
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let codigo = ''
  for (let i = 0; i < 6; i++) {
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)]
  }
  return codigo
}

export function EquiposPanel({ campanaId, espacios }: Props) {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [espaciosPorEquipo, setEspaciosPorEquipo] = useState<Record<string, string[]>>({})
  const [miembrosPorEquipo, setMiembrosPorEquipo] = useState<Record<string, number>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [nombreEquipo, setNombreEquipo] = useState('')
  const [espaciosElegidos, setEspaciosElegidos] = useState<string[]>([])
  const [guardando, setGuardando] = useState(false)
  const [copiadoId, setCopiadoId] = useState<string | null>(null)

  async function cargar() {
    setCargando(true)
    setError(null)

    const { data: eq, error: errEq } = await supabase
      .from('equipos')
      .select('*')
      .eq('campana_id', campanaId)
      .order('nombre')

    if (errEq) {
      setError('No se pudieron cargar los equipos: ' + errEq.message)
      setCargando(false)
      return
    }

    const listaEquipos = (eq as Equipo[]) ?? []
    setEquipos(listaEquipos)

    if (listaEquipos.length > 0) {
      const equipoIds = listaEquipos.map((e) => e.id)

      const { data: rel } = await supabase
        .from('equipo_espacios')
        .select('equipo_id, espacio_id')
        .in('equipo_id', equipoIds)

      const mapaEspacios: Record<string, string[]> = {}
      for (const r of (rel as { equipo_id: string; espacio_id: string }[]) ?? []) {
        mapaEspacios[r.equipo_id] = [...(mapaEspacios[r.equipo_id] ?? []), r.espacio_id]
      }
      setEspaciosPorEquipo(mapaEspacios)

      const { data: miembros } = await supabase
        .from('equipo_miembros')
        .select('equipo_id')
        .in('equipo_id', equipoIds)

      const mapaMiembros: Record<string, number> = {}
      for (const m of (miembros as { equipo_id: string }[]) ?? []) {
        mapaMiembros[m.equipo_id] = (mapaMiembros[m.equipo_id] ?? 0) + 1
      }
      setMiembrosPorEquipo(mapaMiembros)
    }

    setCargando(false)
  }

  useEffect(() => {
    if (campanaId) cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campanaId])

  function alternarEspacio(id: string) {
    setEspaciosElegidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function crearEquipo() {
    if (!nombreEquipo.trim()) {
      setError('Ponele un nombre al equipo.')
      return
    }
    setGuardando(true)
    setError(null)

    const codigo = generarCodigo()

    const { data: nuevoEquipo, error: errEq } = await supabase
      .from('equipos')
      .insert({ campana_id: campanaId, nombre: nombreEquipo, codigo_invitacion: codigo })
      .select()
      .single()

    if (errEq) {
      setError('No se pudo crear el equipo: ' + errEq.message)
      setGuardando(false)
      return
    }

    const equipo = nuevoEquipo as Equipo

    if (espaciosElegidos.length > 0) {
      const filas = espaciosElegidos.map((espacioId) => ({ equipo_id: equipo.id, espacio_id: espacioId }))
      const { error: errRel } = await supabase.from('equipo_espacios').insert(filas)
      if (errRel) {
        setError('El equipo se creó, pero no se pudieron asignar todos los espacios: ' + errRel.message)
      }
    }

    setEquipos((prev) => [...prev, equipo])
    setEspaciosPorEquipo((prev) => ({ ...prev, [equipo.id]: espaciosElegidos }))
    setNombreEquipo('')
    setEspaciosElegidos([])
    setMostrarForm(false)
    setGuardando(false)
  }

  function copiarCodigo(codigo: string, equipoId: string) {
    navigator.clipboard?.writeText(codigo)
    setCopiadoId(equipoId)
    setTimeout(() => setCopiadoId(null), 1500)
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2 className="el-title" style={{ fontSize: 18, marginBottom: 4 }}>
        Equipos ({equipos.length})
      </h2>
      <p className="el-hint" style={{ marginBottom: 12 }}>
        Cada equipo tiene un código para que sus estudiantes se unan y queden asignados automáticamente a
        los espacios que elijas.
      </p>

      {error && <div className="el-error">{error}</div>}

      {!mostrarForm ? (
        <button
          type="button"
          className="el-btn el-btn-ghost"
          style={{ marginBottom: 14 }}
          onClick={() => setMostrarForm(true)}
        >
          + Nuevo equipo
        </button>
      ) : (
        <div className="el-card" style={{ marginBottom: 14 }}>
          <div className="el-field">
            <label className="el-label">Nombre del equipo</label>
            <input
              className="el-input"
              value={nombreEquipo}
              onChange={(e) => setNombreEquipo(e.target.value)}
              placeholder='Ej: "Equipo Norte"'
            />
          </div>

          <div className="el-field">
            <label className="el-label">Espacios asignados</label>
            {espacios.length === 0 ? (
              <p className="el-hint">Todavía no dibujaste espacios en el mapa de arriba.</p>
            ) : (
              espacios.map((esp) => (
                <label
                  key={esp.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 15 }}
                >
                  <input
                    type="checkbox"
                    checked={espaciosElegidos.includes(esp.id)}
                    onChange={() => alternarEspacio(esp.id)}
                  />
                  {esp.nombre}
                </label>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="el-btn el-btn-ghost"
              onClick={() => {
                setMostrarForm(false)
                setEspaciosElegidos([])
              }}
            >
              Cancelar
            </button>
            <button type="button" className="el-btn el-btn-primary" disabled={guardando} onClick={crearEquipo}>
              {guardando ? 'Guardando…' : 'Crear equipo'}
            </button>
          </div>
        </div>
      )}

      {cargando ? (
        <p className="el-hint">Cargando equipos…</p>
      ) : equipos.length === 0 ? (
        <p className="el-hint">Todavía no creaste ningún equipo para esta campaña.</p>
      ) : (
        equipos.map((eq) => {
          const idsEspacios = espaciosPorEquipo[eq.id] ?? []
          const nombresEspacios = idsEspacios
            .map((id) => espacios.find((e) => e.id === id)?.nombre)
            .filter(Boolean)
            .join(', ')
          return (
            <div key={eq.id} className="el-card" style={{ marginBottom: 10 }}>
              <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>{eq.nombre}</p>
              <p className="el-admin-linea">
                <strong>Espacios:</strong> {nombresEspacios || 'Ninguno asignado'}
              </p>
              <p className="el-admin-linea">
                <strong>Miembros:</strong> {miembrosPorEquipo[eq.id] ?? 0}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 8,
                  background: 'var(--ink)',
                  border: '1px solid var(--ink-line)',
                  borderRadius: 8,
                  padding: '8px 12px',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, letterSpacing: 2, flex: 1 }}>
                  {eq.codigo_invitacion}
                </span>
                <button
                  type="button"
                  className="el-btn el-btn-ghost"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
                  onClick={() => copiarCodigo(eq.codigo_invitacion, eq.id)}
                >
                  {copiadoId === eq.id ? '✓ Copiado' : 'Copiar código'}
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
