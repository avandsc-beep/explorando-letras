import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface MiEquipo {
  equipo_id: string
  nombre_equipo: string
  nombre_campana: string
}

export function UnirseEquipo() {
  const { user } = useAuth()
  const [codigo, setCodigo] = useState('')
  const [uniendo, setUniendo] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [misEquipos, setMisEquipos] = useState<MiEquipo[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  async function cargarMisEquipos() {
    if (!user) return
    setCargando(true)
    const { data, error: err } = await supabase
      .from('equipo_miembros')
      .select('equipo_id, equipos(nombre, campanas(nombre))')
      .eq('usuario_id', user.id)

    if (!err && data) {
      const lista: MiEquipo[] = (
        data as unknown as {
          equipo_id: string
          equipos: { nombre: string; campanas: { nombre: string } } | null
        }[]
      ).map((row) => ({
        equipo_id: row.equipo_id,
        nombre_equipo: row.equipos?.nombre ?? '—',
        nombre_campana: row.equipos?.campanas?.nombre ?? '—',
      }))
      setMisEquipos(lista)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarMisEquipos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function unirse() {
    if (!user) return
    const codigoLimpio = codigo.trim().toUpperCase()
    if (!codigoLimpio) {
      setMensaje({ tipo: 'error', texto: 'Ingresá el código que te compartió tu profesor.' })
      return
    }

    setUniendo(true)
    setMensaje(null)

    const { data: equipo, error: errBusqueda } = await supabase
      .from('equipos')
      .select('id, nombre')
      .eq('codigo_invitacion', codigoLimpio)
      .maybeSingle()

    if (errBusqueda || !equipo) {
      setMensaje({ tipo: 'error', texto: 'Ese código no corresponde a ningún equipo activo. Revisalo con tu profesor.' })
      setUniendo(false)
      return
    }

    const { error: errInsert } = await supabase
      .from('equipo_miembros')
      .insert({ equipo_id: equipo.id, usuario_id: user.id })

    if (errInsert && !errInsert.message.includes('duplicate')) {
      setMensaje({ tipo: 'error', texto: 'No se pudo unir al equipo: ' + errInsert.message })
      setUniendo(false)
      return
    }

    setMensaje({ tipo: 'ok', texto: `Te uniste a "${equipo.nombre}".` })
    setCodigo('')
    setMostrarForm(false)
    await cargarMisEquipos()
    setUniendo(false)
  }

  return (
    <div className="el-card" style={{ marginBottom: 16 }}>
      <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>Mis equipos</p>

      {cargando ? (
        <p className="el-hint">Cargando…</p>
      ) : misEquipos.length === 0 ? (
        <p className="el-hint">Todavía no formás parte de ningún equipo de investigación.</p>
      ) : (
        misEquipos.map((eq) => (
          <p key={eq.equipo_id} className="el-admin-linea">
            <strong>{eq.nombre_equipo}</strong> — {eq.nombre_campana}
          </p>
        ))
      )}

      {mensaje && (
        <div
          className={mensaje.tipo === 'error' ? 'el-error' : undefined}
          style={
            mensaje.tipo === 'ok'
              ? {
                  background: 'rgba(90, 156, 74, 0.15)',
                  border: '1px solid var(--leaf)',
                  color: 'var(--leaf)',
                  borderRadius: 8,
                  padding: '10px 13px',
                  fontSize: 14,
                  marginTop: 10,
                }
              : { marginTop: 10 }
          }
        >
          {mensaje.texto}
        </div>
      )}

      {!mostrarForm ? (
        <button
          type="button"
          className="el-btn el-btn-ghost"
          style={{ marginTop: 10 }}
          onClick={() => setMostrarForm(true)}
        >
          Tengo un código de invitación
        </button>
      ) : (
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <input
            className="el-input"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ej: A3K9PZ"
            style={{ textTransform: 'uppercase' }}
            maxLength={6}
          />
          <button
            type="button"
            className="el-btn el-btn-primary"
            style={{ width: 'auto', padding: '0 20px' }}
            disabled={uniendo}
            onClick={unirse}
          >
            {uniendo ? '…' : 'Unirme'}
          </button>
        </div>
      )}
    </div>
  )
}
