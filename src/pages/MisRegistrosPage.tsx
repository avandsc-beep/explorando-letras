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

interface GrupoPendienteEntrega {
  campanaId: string
  campanaNombre: string
  registros: Registro[]
}

export function MisRegistrosPage() {
  const { user } = useAuth()
  const [registros, setRegistros] = useState<Registro[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entregando, setEntregando] = useState<string | null>(null)
  const [nombresCampanas, setNombresCampanas] = useState<Record<string, string>>({})

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
      const regs = (data as Registro[]) ?? []
      setRegistros(regs)

      const idsCampanas = [...new Set(regs.map((r) => r.campana_id).filter(Boolean))] as string[]
      if (idsCampanas.length > 0) {
        const { data: campanas } = await supabase.from('campanas').select('id, nombre').in('id', idsCampanas)
        const mapa: Record<string, string> = {}
        for (const c of (campanas as { id: string; nombre: string }[]) ?? []) {
          mapa[c.id] = c.nombre
        }
        setNombresCampanas(mapa)
      }
    }
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Piezas de investigación completas, listas para entregar (todavía sin informe)
  const gruposPendientesDeEntrega: GrupoPendienteEntrega[] = []
  for (const r of registros) {
    if (r.origen !== 'investigacion' || r.estado !== 'completa' || r.informe_id) continue
    let grupo = gruposPendientesDeEntrega.find((g) => g.campanaId === r.campana_id)
    if (!grupo) {
      grupo = { campanaId: r.campana_id!, campanaNombre: nombresCampanas[r.campana_id!] ?? 'Campaña', registros: [] }
      gruposPendientesDeEntrega.push(grupo)
    }
    grupo.registros.push(r)
  }

  async function entregarInforme(grupo: GrupoPendienteEntrega) {
    if (!user) return
    setEntregando(grupo.campanaId)
    setError(null)

    const { data: informe, error: errInforme } = await supabase
      .from('informes')
      .insert({
        usuario_id: user.id,
        campana_id: grupo.campanaId,
        estado: 'entregado',
        fecha_entrega: new Date().toISOString(),
      })
      .select()
      .single()

    if (errInforme || !informe) {
      setError('No se pudo crear el informe: ' + (errInforme?.message ?? ''))
      setEntregando(null)
      return
    }

    const idsRegistros = grupo.registros.map((r) => r.id)
    const { error: errUpdate } = await supabase
      .from('registros')
      .update({ informe_id: informe.id })
      .in('id', idsRegistros)

    if (errUpdate) {
      setError('El informe se creó, pero no se pudieron vincular todas las piezas: ' + errUpdate.message)
    }

    await cargar()
    setEntregando(null)
  }

  return (
    <div className="el-main" style={{ paddingBottom: 90 }}>
      <h1 className="el-title">Mis registros</h1>
      <p className="el-subtitle">
        Acá vas a ver siempre lo que registraste y en qué estado está — te confirma que se guardó
        correctamente.
      </p>

      <UnirseEquipo />

      {gruposPendientesDeEntrega.map((grupo) => (
        <div
          key={grupo.campanaId}
          className="el-card"
          style={{ marginBottom: 16, border: '1px solid var(--magenta)' }}
        >
          <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>
            {grupo.campanaNombre} — {grupo.registros.length} pieza
            {grupo.registros.length === 1 ? '' : 's'} completa{grupo.registros.length === 1 ? '' : 's'}
          </p>
          <p className="el-hint" style={{ marginBottom: 10 }}>
            Cuando termines de cubrir tu zona, armá y entregá tu informe con todas estas piezas juntas.
          </p>
          <button
            type="button"
            className="el-btn el-btn-primary"
            disabled={entregando === grupo.campanaId}
            onClick={() => entregarInforme(grupo)}
          >
            {entregando === grupo.campanaId ? 'Entregando…' : 'Armar y entregar informe'}
          </button>
        </div>
      ))}

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
              <span className={`el-badge el-badge-${r.estado}`}>{r.estado.replace('_', ' ')}</span>{' '}
              <span className="el-badge" style={{ color: 'var(--paper-dim)', background: 'transparent', border: '1px solid var(--ink-line)' }}>
                {r.origen === 'investigacion' ? 'Investigación' : 'Personal'}
              </span>
              <p className="el-admin-linea" style={{ marginTop: 6 }}>
                {r.origen === 'investigacion' && r.estado === 'completa'
                  ? r.informe_id
                    ? 'Entregado en tu informe, esperando revisión'
                    : 'Completo — todavía no incluido en un informe entregado'
                  : ETIQUETAS_ESTADO[r.estado]}
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
                <p className="el-admin-linea" style={{ color: 'var(--magenta)' }}>
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
