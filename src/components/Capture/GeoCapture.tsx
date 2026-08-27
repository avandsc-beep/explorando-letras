import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix del ícono por defecto de Leaflet en bundlers (Vite/Webpack)
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png'
const iconoDefecto = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = iconoDefecto

const UMBRAL_PRECISION_METROS = 20

export interface Ubicacion {
  lat: number
  lng: number
  precisionMetros: number | null
}

interface Props {
  onUbicacionLista: (u: Ubicacion) => void
}

export function GeoCapture({ onUbicacionLista }: Props) {
  const [estado, setEstado] = useState<'buscando' | 'lista' | 'error' | 'ajuste_requerido'>('buscando')
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const mapDivRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMsg('Este navegador no soporta geolocalización.')
      setEstado('error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const u: Ubicacion = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precisionMetros: pos.coords.accuracy,
        }
        setUbicacion(u)
        setEstado(u.precisionMetros && u.precisionMetros > UMBRAL_PRECISION_METROS ? 'ajuste_requerido' : 'lista')
      },
      (err) => {
        setErrorMsg(
          err.code === err.PERMISSION_DENIED
            ? 'No se otorgó permiso de ubicación. Habilitalo en la configuración del navegador para continuar.'
            : 'No se pudo obtener la ubicación. Intentá de nuevo.'
        )
        setEstado('error')
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }, [])

  // Montar el mapa una vez que tenemos una ubicación inicial
  useEffect(() => {
    if (!ubicacion || !mapDivRef.current || mapRef.current) return

    const map = L.map(mapDivRef.current).setView([ubicacion.lat, ubicacion.lng], 18)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    const marker = L.marker([ubicacion.lat, ubicacion.lng], { draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      setUbicacion((prev) => (prev ? { ...prev, lat: pos.lat, lng: pos.lng } : prev))
      setEstado('lista')
      if (circleRef.current) circleRef.current.remove()
    })

    if (ubicacion.precisionMetros) {
      circleRef.current = L.circle([ubicacion.lat, ubicacion.lng], {
        radius: ubicacion.precisionMetros,
        color: '#2a9d92',
        fillOpacity: 0.12,
      }).addTo(map)
    }

    mapRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [ubicacion !== null])

  function confirmar() {
    if (ubicacion) onUbicacionLista(ubicacion)
  }

  if (estado === 'buscando') {
    return <div className="el-hint">Obteniendo tu ubicación…</div>
  }

  if (estado === 'error') {
    return <div className="el-error">{errorMsg}</div>
  }

  return (
    <div className="el-field">
      <label className="el-label">Ubicación de la pieza</label>
      {estado === 'ajuste_requerido' && (
        <div className="el-error">
          La precisión del GPS es baja (±{Math.round(ubicacion?.precisionMetros ?? 0)}m). Arrastrá el pin
          hasta la ubicación correcta antes de continuar.
        </div>
      )}
      <div ref={mapDivRef} style={{ height: 240, borderRadius: 8, overflow: 'hidden' }} />
      <p className="el-hint">
        {ubicacion?.precisionMetros
          ? `Precisión estimada: ±${Math.round(ubicacion.precisionMetros)}m. Arrastrá el pin si no cae en el lugar correcto.`
          : 'Arrastrá el pin para ajustar la ubicación.'}
      </p>
      <button type="button" className="el-btn el-btn-primary" style={{ marginTop: 8 }} onClick={confirmar}>
        Confirmar ubicación
      </button>
    </div>
  )
}
