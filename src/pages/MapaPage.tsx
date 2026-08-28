import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { supabase, type Registro, type Lexico } from '../lib/supabase'

import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png'
const iconoDefecto = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = iconoDefecto

interface Filtros {
  ciudad: string
  tecnica: string
  soporte: string
  funcion: string
}

const FILTROS_VACIOS: Filtros = { ciudad: '', tecnica: '', soporte: '', funcion: '' }

export function MapaPage() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [lexicos, setLexicos] = useState<Lexico[]>([])
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autores, setAutores] = useState<Record<string, string>>({})

  const mapDivRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)

  // Cargar léxicos (para las opciones de filtro) una sola vez
  useEffect(() => {
    supabase
      .from('lexicos')
      .select('*')
      .eq('activo', true)
      .then(({ data }) => setLexicos((data as Lexico[]) ?? []))
  }, [])

  // Cargar registros validados según los filtros activos
  useEffect(() => {
    setCargando(true)
    setError(null)

    let query = supabase.from('registros').select('*').eq('estado', 'validada')

    if (filtros.ciudad) query = query.eq('ciudad', filtros.ciudad)
    if (filtros.tecnica) query = query.eq('tecnica', filtros.tecnica)
    if (filtros.soporte) query = query.eq('soporte', filtros.soporte)
    if (filtros.funcion) query = query.eq('funcion', filtros.funcion)

    query.then(async ({ data, error: err }) => {
      if (err) {
        setError('No se pudieron cargar los registros: ' + err.message)
        setCargando(false)
        return
      }
      const regs = (data as Registro[]) ?? []
      setRegistros(regs)

      // Traer nombres públicos de los autores para mostrar en la ficha
      const idsUnicos = [...new Set(regs.map((r) => r.usuario_id))]
      if (idsUnicos.length > 0) {
        const { data: perfiles } = await supabase
          .from('perfiles')
          .select('id, nombre_publico')
          .in('id', idsUnicos)
        const mapa: Record<string, string> = {}
        for (const p of (perfiles as { id: string; nombre_publico: string }[]) ?? []) {
          mapa[p.id] = p.nombre_publico
        }
        setAutores(mapa)
      }
      setCargando(false)
    })
  }, [filtros])

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return
    const map = L.map(mapDivRef.current).setView([-17.7833, -63.1821], 15) // Santa Cruz de la Sierra
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    const cluster = L.markerClusterGroup()
    cluster.addTo(map)

    mapRef.current = map
    clusterRef.current = cluster

    const forzarRecalculoTamano = () => map.invalidateSize()
    setTimeout(forzarRecalculoTamano, 100)
    setTimeout(forzarRecalculoTamano, 400)

    const observador = new ResizeObserver(forzarRecalculoTamano)
    if (mapDivRef.current) observador.observe(mapDivRef.current)

    return () => {
      observador.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Repintar marcadores cuando cambian los registros
  useEffect(() => {
    const cluster = clusterRef.current
    const map = mapRef.current
    if (!cluster || !map) return

    cluster.clearLayers()

    for (const r of registros) {
      const autor = autores[r.usuario_id] ?? 'Alguien'
      const popupHtml = `
        <div style="font-family: 'Space Grotesk', sans-serif; max-width: 220px;">
          ${r.foto_url ? `<img src="${r.foto_url}" style="width:100%;border-radius:6px;margin-bottom:8px;" />` : ''}
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${r.id_unico ?? 'Pieza registrada'}</div>
          <div style="font-size:13px;color:#555;">
            ${r.tecnica ?? '—'} · ${r.soporte ?? '—'}
          </div>
          <div style="font-size:12px;color:#888;margin-top:6px;">Registrado por ${autor}</div>
        </div>
      `
      const marker = L.marker([r.latitud, r.longitud]).bindPopup(popupHtml)
      cluster.addLayer(marker)
    }

    if (registros.length > 0) {
      const grupo = L.featureGroup(cluster.getLayers() as L.Layer[])
      if (registros.length > 1) {
        map.fitBounds(grupo.getBounds().pad(0.2))
      }
    }
  }, [registros, autores])

  function opciones(categoria: Lexico['categoria']) {
    return [...new Set(lexicos.filter((l) => l.categoria === categoria).map((l) => l.valor))]
  }

  const ciudades = [...new Set(registros.map((r) => r.ciudad))]

  return (
    <div className="el-mapa-wrap">
      <div className="el-mapa-filtros">
        <select
          className="el-select el-select-compacto"
          value={filtros.ciudad}
          onChange={(e) => setFiltros({ ...filtros, ciudad: e.target.value })}
        >
          <option value="">Todas las ciudades</option>
          {ciudades.map((c) => (
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
          <option value="">Técnica</option>
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
          <option value="">Soporte</option>
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
          <option value="">Función</option>
          {opciones('funcion').map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {(filtros.ciudad || filtros.tecnica || filtros.soporte || filtros.funcion) && (
          <button
            type="button"
            className="el-btn el-btn-ghost el-btn-limpiar"
            onClick={() => setFiltros(FILTROS_VACIOS)}
          >
            Limpiar
          </button>
        )}
      </div>

      {error && (
        <div className="el-error" style={{ margin: '10px 16px 0' }}>
          {error}
        </div>
      )}

      <div ref={mapDivRef} className="el-mapa-canvas" />

      <div className="el-mapa-contador">
        {cargando ? 'Cargando piezas…' : `${registros.length} pieza${registros.length === 1 ? '' : 's'} en el mapa`}
      </div>
    </div>
  )
}
