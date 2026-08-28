import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import { supabase } from '../lib/supabase'

import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png'
const iconoDefecto = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = iconoDefecto

interface Campana {
  id: string
  nombre: string
  ciudad: string
  anio: number
  cuadrante_general: string | null
  estado: string
}

interface Espacio {
  id: string
  campana_id: string
  nombre: string
  poligono: { lat: number; lng: number }[]
}

const COLORES_ESPACIOS = ['#e0913f', '#5a9c4a', '#c25b8f', '#4a90c2', '#b5482f']

export function CampanasPage() {
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<string>('')
  const [espacios, setEspacios] = useState<Espacio[]>([])
  const [error, setError] = useState<string | null>(null)
  const [debugPasos, setDebugPasos] = useState<string[]>([])
  const agregarPaso = (msg: string) => setDebugPasos((prev) => [...prev, msg])
  const [cargando, setCargando] = useState(true)

  // Formulario nueva campaña
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [cuadrante, setCuadrante] = useState('')
  const [guardandoCampana, setGuardandoCampana] = useState(false)

  const mapDivRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null)

  async function cargarCampanas() {
    setCargando(true)
    const { data, error: err } = await supabase
      .from('campanas')
      .select('*')
      .order('anio', { ascending: false })
    if (err) {
      setError('No se pudieron cargar las campañas: ' + err.message)
    } else {
      setCampanas((data as Campana[]) ?? [])
      if (!campanaSeleccionada && data && data.length > 0) {
        setCampanaSeleccionada(data[0].id)
      }
    }
    setCargando(false)
  }

  async function cargarEspacios(campanaId: string) {
    if (!campanaId) {
      setEspacios([])
      return
    }
    const { data, error: err } = await supabase
      .from('espacios')
      .select('*')
      .eq('campana_id', campanaId)
    if (err) {
      setError('No se pudieron cargar los espacios: ' + err.message)
    } else {
      setEspacios((data as Espacio[]) ?? [])
    }
  }

  useEffect(() => {
    cargarCampanas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    cargarEspacios(campanaSeleccionada)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campanaSeleccionada])

  async function crearCampana() {
    if (!nombre.trim() || !ciudad.trim()) {
      setError('Completá al menos el nombre y la ciudad de la campaña.')
      return
    }
    setGuardandoCampana(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('campanas')
      .insert({
        nombre,
        ciudad,
        anio,
        cuadrante_general: cuadrante || null,
        estado: 'activa',
      })
      .select()
      .single()

    if (err) {
      setError('No se pudo crear la campaña: ' + err.message)
    } else {
      setCampanas((prev) => [data as Campana, ...prev])
      setCampanaSeleccionada((data as Campana).id)
      setNombre('')
      setCiudad('')
      setCuadrante('')
      setMostrarForm(false)
    }
    setGuardandoCampana(false)
  }

  // Inicializar mapa + controles de dibujo una sola vez
  useEffect(() => {
    agregarPaso(`Efecto disparado. mapDivRef=${!!mapDivRef.current} mapRef=${!!mapRef.current}`)
    if (!mapDivRef.current || mapRef.current) return

    try {
      agregarPaso('Creando L.map()…')
      const map = L.map(mapDivRef.current).setView([-17.7833, -63.1821], 15)
      agregarPaso('L.map() creado OK. Agregando capa de tiles…')
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)
      agregarPaso('Capa de tiles agregada.')

      const drawnItems = new L.FeatureGroup()
      map.addLayer(drawnItems)
      drawnItemsRef.current = drawnItems

      mapRef.current = map

      // Fix de Leaflet: si el contenedor no tenía tamaño definido en el momento
      // de crear el mapa (pasa al estar dentro de pestañas/tabs), hay que forzar
      // el recálculo del tamaño una vez que el contenedor ya está visible.
      const forzarRecalculoTamano = () => map.invalidateSize()
      setTimeout(forzarRecalculoTamano, 100)
      setTimeout(forzarRecalculoTamano, 400)

      const observador = new ResizeObserver(forzarRecalculoTamano)
      observador.observe(mapDivRef.current)
      agregarPaso(`Tamaño del contenedor: ${mapDivRef.current.clientWidth}x${mapDivRef.current.clientHeight}px`)

      // El control de dibujo se agrega en un segundo paso, envuelto aparte,
      // para que si algo falla acá el mapa base ya haya quedado visible.
      try {
        const drawControl = new L.Control.Draw({
          draw: {
            polygon: {
              shapeOptions: { color: '#e0913f' },
            },
            marker: false,
            circle: false,
            circlemarker: false,
            polyline: false,
            rectangle: false,
          },
          edit: {
            featureGroup: drawnItems,
            remove: false,
          },
        })
        map.addControl(drawControl)

        map.on(L.Draw.Event.CREATED, async (e: L.LeafletEvent) => {
          const layer = (e as L.DrawEvents.Created).layer as L.Polygon
          const nombreEspacio = window.prompt('Nombre de este espacio (ej: "Manzana A")')
          if (!nombreEspacio) return

          const latLngs = (layer.getLatLngs()[0] as L.LatLng[]).map((p) => ({
            lat: p.lat,
            lng: p.lng,
          }))

          const campId = campanaSeleccionadaRef.current
          if (!campId) {
            window.alert('Elegí primero una campaña arriba.')
            return
          }

          const { data, error: err } = await supabase
            .from('espacios')
            .insert({ campana_id: campId, nombre: nombreEspacio, poligono: latLngs })
            .select()
            .single()

          if (err) {
            setError('No se pudo guardar el espacio: ' + err.message)
            return
          }

          drawnItems.addLayer(layer)
          setEspacios((prev) => [...prev, data as Espacio])
        })
      } catch (errDraw) {
        console.error('Error al inicializar el control de dibujo:', errDraw)
        setError(
          'El mapa cargó, pero la herramienta de dibujo no pudo activarse: ' +
            (errDraw instanceof Error ? errDraw.message : String(errDraw)),
        )
      }

      return () => {
        observador.disconnect()
        map.remove()
        mapRef.current = null
      }
    } catch (errMapa) {
      console.error('Error al inicializar el mapa:', errMapa)
      setError(
        'No se pudo cargar el mapa: ' + (errMapa instanceof Error ? errMapa.message : String(errMapa)),
      )
      return
    }
  }, [])

  // Ref auxiliar para leer la campaña seleccionada dentro del handler de Leaflet
  const campanaSeleccionadaRef = useRef(campanaSeleccionada)
  useEffect(() => {
    campanaSeleccionadaRef.current = campanaSeleccionada
  }, [campanaSeleccionada])

  // Repintar los polígonos guardados cuando cambia la campaña seleccionada
  useEffect(() => {
    const map = mapRef.current
    const drawnItems = drawnItemsRef.current
    if (!map || !drawnItems) return

    drawnItems.clearLayers()

    espacios.forEach((esp, i) => {
      const color = COLORES_ESPACIOS[i % COLORES_ESPACIOS.length]
      const poly = L.polygon(
        esp.poligono.map((p) => [p.lat, p.lng]) as [number, number][],
        { color },
      ).bindTooltip(esp.nombre, { permanent: true, direction: 'center' })
      drawnItems.addLayer(poly)
    })

    if (espacios.length > 0) {
      const grupo = L.featureGroup(drawnItems.getLayers() as L.Layer[])
      map.fitBounds(grupo.getBounds().pad(0.15))
    }
  }, [espacios])

  return (
    <div className="el-main" style={{ paddingBottom: 90 }}>
      <h1 className="el-title">Campañas y espacios</h1>
      <p className="el-subtitle">
        Creá una campaña por cuadrante/año y dibujá los espacios (manzanas o zonas) que los equipos van a
        cubrir.
      </p>

      {error && <div className="el-error">{error}</div>}

      <div className="el-field">
        <label className="el-label">Campaña activa</label>
        <select
          className="el-select"
          value={campanaSeleccionada}
          onChange={(e) => setCampanaSeleccionada(e.target.value)}
        >
          <option value="">— Elegí una campaña —</option>
          {campanas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} ({c.ciudad}, {c.anio})
            </option>
          ))}
        </select>
      </div>

      {!mostrarForm ? (
        <button
          type="button"
          className="el-btn el-btn-ghost"
          style={{ marginBottom: 16 }}
          onClick={() => setMostrarForm(true)}
        >
          + Nueva campaña
        </button>
      ) : (
        <div className="el-card" style={{ marginBottom: 16 }}>
          <div className="el-field">
            <label className="el-label">Nombre de la campaña</label>
            <input
              className="el-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder='Ej: "2026 — Cuadrante Norte"'
            />
          </div>
          <div className="el-field">
            <label className="el-label">Ciudad</label>
            <input
              className="el-input"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Santa Cruz de la Sierra"
            />
          </div>
          <div className="el-field">
            <label className="el-label">Año</label>
            <input
              className="el-input"
              type="number"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
            />
          </div>
          <div className="el-field">
            <label className="el-label">Cuadrante general (opcional)</label>
            <input
              className="el-input"
              value={cuadrante}
              onChange={(e) => setCuadrante(e.target.value)}
              placeholder="Norte"
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="el-btn el-btn-ghost" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="el-btn el-btn-primary"
              disabled={guardandoCampana}
              onClick={crearCampana}
            >
              {guardandoCampana ? 'Guardando…' : 'Crear campaña'}
            </button>
          </div>
        </div>
      )}

      {campanaSeleccionada && (
        <>
          <p className="el-hint" style={{ marginBottom: 8 }}>
            Usá el ícono de polígono (⬠) en la esquina del mapa para dibujar un espacio nuevo. Al cerrar el
            polígono, te va a pedir el nombre.
          </p>
          {debugPasos.length > 0 && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--teal)',
                background: 'var(--ink-soft)',
                border: '1px solid var(--ink-line)',
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
                whiteSpace: 'pre-wrap',
              }}
            >
              {debugPasos.map((p, i) => (
                <div key={i}>
                  {i + 1}. {p}
                </div>
              ))}
            </div>
          )}
          <div ref={mapDivRef} className="el-campanas-mapa" />

          <h2 className="el-title" style={{ fontSize: 18, marginTop: 20 }}>
            Espacios de esta campaña ({espacios.length})
          </h2>
          {espacios.length === 0 ? (
            <p className="el-hint">Todavía no dibujaste ningún espacio.</p>
          ) : (
            espacios.map((esp, i) => (
              <div key={esp.id} className="el-admin-linea" style={{ padding: '6px 0' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: COLORES_ESPACIOS[i % COLORES_ESPACIOS.length],
                    marginRight: 8,
                  }}
                />
                {esp.nombre}
              </div>
            ))
          )}
        </>
      )}

      {cargando && <p className="el-hint">Cargando…</p>}
    </div>
  )
}
