import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { PhotoCapture } from '../components/Capture/PhotoCapture'
import { GeoCapture, type Ubicacion } from '../components/Capture/GeoCapture'
import { ClasificacionForm, type DatosClasificacion } from '../components/Capture/ClasificacionForm'

type Paso = 'modo' | 'foto' | 'ubicacion' | 'clasificacion' | 'guardado'

interface Props {
  onGuardado?: () => void
}

interface OpcionInvestigacion {
  equipoId: string
  campanaId: string
  campanaNombre: string
  espacioId: string
  espacioNombre: string
}

const CLASIFICACION_VACIA: DatosClasificacion = {
  ciudad: '',
  direccion_calle: '',
  referencia: '',
  soporte: '',
  tecnica: '',
  funcion: '',
  estado_conservacion: '',
  presencia_serifas: '',
  grosor_trazo: '',
  estilo_general: '',
  texto_principal: '',
}

export function CapturePage({ onGuardado }: Props) {
  const { user } = useAuth()
  const [paso, setPaso] = useState<Paso>('modo')
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null)
  const [clasificacion, setClasificacion] = useState<DatosClasificacion>(CLASIFICACION_VACIA)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [estadoGuardado, setEstadoGuardado] = useState<'borrador' | 'completa' | null>(null)

  const [opciones, setOpciones] = useState<OpcionInvestigacion[]>([])
  const [cargandoOpciones, setCargandoOpciones] = useState(true)
  const [opcionElegida, setOpcionElegida] = useState<OpcionInvestigacion | 'personal' | null>(null)

  useEffect(() => {
    async function cargarOpciones() {
      if (!user) return
      setCargandoOpciones(true)

      const { data, error: err } = await supabase
        .from('equipo_miembros')
        .select(
          'equipo_id, equipos!inner(id, nombre, campana_id, campanas!inner(id, nombre, estado), equipo_espacios(espacio_id, espacios(id, nombre)))',
        )
        .eq('usuario_id', user.id)

      if (err || !data) {
        setCargandoOpciones(false)
        return
      }

      type Fila = {
        equipo_id: string
        equipos: {
          nombre: string
          campana_id: string
          campanas: { nombre: string; estado: string }
          equipo_espacios: { espacio_id: string; espacios: { id: string; nombre: string } | null }[]
        }
      }

      const lista: OpcionInvestigacion[] = []
      for (const fila of data as unknown as Fila[]) {
        if (fila.equipos.campanas.estado !== 'activa') continue
        for (const rel of fila.equipos.equipo_espacios ?? []) {
          if (!rel.espacios) continue
          lista.push({
            equipoId: fila.equipo_id,
            campanaId: fila.equipos.campana_id,
            campanaNombre: fila.equipos.campanas.nombre,
            espacioId: rel.espacios.id,
            espacioNombre: rel.espacios.nombre,
          })
        }
      }
      setOpciones(lista)
      setCargandoOpciones(false)
    }
    cargarOpciones()
  }, [user])

  function onFotoLista(blob: Blob, previewUrl: string) {
    setFotoBlob(blob)
    setFotoPreview(previewUrl)
    setPaso('ubicacion')
  }

  function onUbicacionLista(u: Ubicacion) {
    setUbicacion(u)
    setPaso('clasificacion')
  }

  async function guardar(estadoFinal: 'borrador' | 'completa') {
    if (!user || !fotoBlob || !ubicacion || !opcionElegida) return
    setGuardando(true)
    setError(null)

    const esInvestigacion = opcionElegida !== 'personal'

    try {
      const nombreArchivo = `${user.id}/${Date.now()}.jpg`
      const { error: errorSubida } = await supabase.storage
        .from('fotos-registros')
        .upload(nombreArchivo, fotoBlob, { contentType: 'image/jpeg' })

      if (errorSubida) throw errorSubida

      const { data: urlData } = supabase.storage.from('fotos-registros').getPublicUrl(nombreArchivo)

      const { error: errorInsert } = await supabase.from('registros').insert({
        usuario_id: user.id,
        origen: esInvestigacion ? 'investigacion' : 'personal',
        campana_id: esInvestigacion ? opcionElegida.campanaId : null,
        espacio_id: esInvestigacion ? opcionElegida.espacioId : null,
        equipo_id: esInvestigacion ? opcionElegida.equipoId : null,
        ciudad: clasificacion.ciudad || 'Santa Cruz de la Sierra',
        latitud: ubicacion.lat,
        longitud: ubicacion.lng,
        precision_gps_metros: ubicacion.precisionMetros,
        direccion_calle: clasificacion.direccion_calle || null,
        referencia: clasificacion.referencia || null,
        foto_url: urlData.publicUrl,
        soporte: clasificacion.soporte || null,
        tecnica: clasificacion.tecnica || null,
        funcion: clasificacion.funcion || null,
        estado_conservacion: clasificacion.estado_conservacion || null,
        presencia_serifas: clasificacion.presencia_serifas || null,
        grosor_trazo: clasificacion.grosor_trazo || null,
        estilo_general: clasificacion.estilo_general || null,
        texto_principal: clasificacion.texto_principal || null,
        estado: estadoFinal,
      })

      if (errorInsert) throw errorInsert

      setEstadoGuardado(estadoFinal)
      setPaso('guardado')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el registro.')
    } finally {
      setGuardando(false)
    }
  }

  function empezarDeNuevo() {
    setPaso('modo')
    setFotoBlob(null)
    setFotoPreview(null)
    setUbicacion(null)
    setClasificacion(CLASIFICACION_VACIA)
    setError(null)
    setOpcionElegida(null)
  }

  return (
    <div className="el-main">
      <div className="el-card">
        <h1 className="el-title">Nuevo registro</h1>
        <p className="el-subtitle">Documentá una pieza de letragrafía en el espacio urbano.</p>

        {error && <div className="el-error">{error}</div>}

        {paso === 'modo' && (
          <>
            {cargandoOpciones ? (
              <p className="el-hint">Cargando…</p>
            ) : (
              <>
                <p className="el-label" style={{ marginBottom: 10 }}>
                  ¿En qué modo registrás esta pieza?
                </p>
                <button
                  type="button"
                  className="el-btn el-btn-ghost"
                  style={{ marginBottom: 10, textAlign: 'left' }}
                  onClick={() => {
                    setOpcionElegida('personal')
                    setPaso('foto')
                  }}
                >
                  📍 Personal — captura libre, sin zona asignada
                </button>

                {opciones.length > 0 && (
                  <>
                    <p className="el-hint" style={{ margin: '4px 0 8px' }}>
                      O elegí tu zona de investigación asignada:
                    </p>
                    {opciones.map((op) => (
                      <button
                        key={op.espacioId + op.equipoId}
                        type="button"
                        className="el-btn el-btn-ghost"
                        style={{ marginBottom: 8, textAlign: 'left' }}
                        onClick={() => {
                          setOpcionElegida(op)
                          setPaso('foto')
                        }}
                      >
                        🎓 {op.espacioNombre} — {op.campanaNombre}
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}

        {paso === 'foto' && <PhotoCapture onFotoLista={onFotoLista} />}

        {paso === 'ubicacion' && (
          <>
            {fotoPreview && (
              <img
                src={fotoPreview}
                style={{ width: '100%', borderRadius: 8, marginBottom: 14 }}
                alt="Foto capturada"
              />
            )}
            <GeoCapture onUbicacionLista={onUbicacionLista} />
          </>
        )}

        {paso === 'clasificacion' && (
          <>
            {fotoPreview && (
              <img
                src={fotoPreview}
                style={{ width: '100%', borderRadius: 8, marginBottom: 14 }}
                alt="Foto capturada"
              />
            )}
            <ClasificacionForm valores={clasificacion} onChange={setClasificacion} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                className="el-btn el-btn-ghost"
                disabled={guardando}
                onClick={() => guardar('borrador')}
              >
                Guardar borrador
              </button>
              <button
                type="button"
                className="el-btn el-btn-primary"
                disabled={guardando}
                onClick={() => guardar('completa')}
              >
                {guardando ? 'Guardando…' : 'Marcar como completa'}
              </button>
            </div>
            <p className="el-hint">
              "Guardar borrador" si querés terminar la ficha más tarde. "Marcar como completa" cuando ya
              está lista para incluir en tu informe.
            </p>
          </>
        )}

        {paso === 'guardado' && (
          <div>
            <div
              style={{
                background: 'rgba(90, 156, 74, 0.15)',
                border: '1px solid var(--leaf)',
                borderRadius: 8,
                padding: '14px 16px',
                marginBottom: 16,
              }}
            >
              <p style={{ color: 'var(--leaf)', fontWeight: 700, margin: '0 0 6px', fontSize: 17 }}>
                ✓ Se subió correctamente a la base de datos
              </p>
              <p style={{ margin: 0, fontSize: 15 }}>
                {estadoGuardado === 'borrador'
                  ? 'Quedó guardado como borrador. Todavía tenés que completar la ficha y marcarla como "completa" para que pase a revisión — podés hacerlo cuando quieras desde "Mis registros".'
                  : opcionElegida !== 'personal'
                    ? 'Quedó marcado como completo. Cuando termines de cubrir tu zona, armá tu informe desde "Mis registros" para entregarlo.'
                    : 'Quedó marcado como completo, esperando revisión del administrador. Vas a poder ver su estado en cualquier momento en "Mis registros".'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="el-btn el-btn-ghost" onClick={empezarDeNuevo}>
                Registrar otra
              </button>
              <button
                type="button"
                className="el-btn el-btn-primary"
                onClick={() => {
                  empezarDeNuevo()
                  onGuardado?.()
                }}
              >
                Ver "Mis registros"
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
