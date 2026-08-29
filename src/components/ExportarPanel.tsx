import { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { supabase, type Registro } from '../lib/supabase'

interface Campana {
  id: string
  nombre: string
}

function escaparCsv(valor: string | null | undefined): string {
  const texto = (valor ?? '').toString()
  if (texto.includes(',') || texto.includes('"') || texto.includes('\n')) {
    return '"' + texto.replace(/"/g, '""') + '"'
  }
  return texto
}

const ENCABEZADOS_CSV = [
  'id_unico',
  '@Foto',
  'ciudad',
  'campana',
  'direccion_calle',
  'referencia',
  'soporte',
  'tecnica',
  'funcion',
  'estado_conservacion',
  'presencia_serifas',
  'grosor_trazo',
  'estilo_general',
  'texto_principal',
  'origen',
  'autor',
  'fecha_registro',
]

const README_TXT = `EXPLORANDO LETRAS — Paquete para diseño editorial
====================================================

Este paquete contiene:

  /fotos/           Una imagen por cada pieza validada, nombrada con su ID único.
  /fichas.csv        Una fila por pieza, con todos sus datos.

CÓMO USARLO EN ADOBE INDESIGN (Data Merge):
--------------------------------------------
1. Abrí InDesign y creá (o abrí) el documento que vas a usar como plantilla
   de página (una página tipo "ficha" con los marcos de texto e imagen que
   quieras repetir para cada pieza).
2. Ventana > Utilidades > Combinación de datos (Window > Utilities > Data Merge).
3. En el panel, elegí "Seleccionar fuente de datos" y abrí el archivo fichas.csv
   de este paquete.
4. Vas a ver la lista de campos disponibles: id_unico, ciudad, tecnica, etc.,
   y un campo especial de imagen llamado "Foto" (marcado con el ícono de imagen,
   gracias a que la columna se llama "@Foto" en el CSV).
5. Arrastrá "Foto" al marco de imagen de tu plantilla, y arrastrá el resto de
   los campos de texto a los marcos de texto correspondientes.
6. Click en "Crear documento combinado" (Create Merged Document) — InDesign va
   a generar automáticamente una página por cada fila del CSV, con su foto y
   sus datos ya puestos en el lugar correcto.

IMPORTANTE: no muevas ni renombres la carpeta "fotos" — el CSV apunta a las
imágenes con una ruta relativa (fotos/ID.jpg), así que fichas.csv y la carpeta
fotos tienen que quedarse siempre juntos, en el mismo lugar.

Generado desde el panel de administración de Explorando Letras.
`

export function ExportarPanel() {
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [campanaId, setCampanaId] = useState('')
  const [origen, setOrigen] = useState<'todos' | 'investigacion' | 'personal'>('todos')
  const [generando, setGenerando] = useState(false)
  const [progreso, setProgreso] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [conteoPrevio, setConteoPrevio] = useState<number | null>(null)

  useEffect(() => {
    supabase
      .from('campanas')
      .select('id, nombre')
      .order('nombre')
      .then(({ data }) => setCampanas((data as Campana[]) ?? []))
  }, [])

  async function contarPiezas() {
    let query = supabase.from('registros').select('id', { count: 'exact', head: true }).eq('estado', 'validada')
    if (campanaId) query = query.eq('campana_id', campanaId)
    if (origen !== 'todos') query = query.eq('origen', origen)
    const { count } = await query
    setConteoPrevio(count ?? 0)
  }

  useEffect(() => {
    contarPiezas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campanaId, origen])

  async function generarPaquete() {
    setGenerando(true)
    setError(null)
    setProgreso('Buscando piezas validadas…')

    let query = supabase.from('registros').select('*').eq('estado', 'validada')
    if (campanaId) query = query.eq('campana_id', campanaId)
    if (origen !== 'todos') query = query.eq('origen', origen)

    const { data, error: errQuery } = await query.order('id_unico')

    if (errQuery) {
      setError('No se pudieron cargar los registros: ' + errQuery.message)
      setGenerando(false)
      return
    }

    const registros = (data as Registro[]) ?? []

    if (registros.length === 0) {
      setError('No hay piezas validadas que coincidan con estos filtros.')
      setGenerando(false)
      return
    }

    // Nombres de autores y campañas, para incluir en el CSV
    const idsUsuarios = [...new Set(registros.map((r) => r.usuario_id))]
    const idsCampanas = [...new Set(registros.map((r) => r.campana_id).filter(Boolean))] as string[]

    const { data: perfiles } = await supabase
      .from('perfiles')
      .select('id, nombre_publico')
      .in('id', idsUsuarios)
    const mapaAutores: Record<string, string> = {}
    for (const p of (perfiles as { id: string; nombre_publico: string }[]) ?? []) {
      mapaAutores[p.id] = p.nombre_publico
    }

    let mapaCampanas: Record<string, string> = {}
    if (idsCampanas.length > 0) {
      const { data: camps } = await supabase.from('campanas').select('id, nombre').in('id', idsCampanas)
      for (const c of (camps as { id: string; nombre: string }[]) ?? []) {
        mapaCampanas[c.id] = c.nombre
      }
    }

    const zip = new JSZip()
    const carpetaFotos = zip.folder('fotos')
    const filasCsv: string[] = [ENCABEZADOS_CSV.join(',')]
    let fallidas = 0

    for (let i = 0; i < registros.length; i++) {
      const r = registros[i]
      const nombreArchivo = `${r.id_unico ?? r.id}.jpg`
      setProgreso(`Descargando foto ${i + 1} de ${registros.length}…`)

      if (r.foto_url) {
        try {
          const resp = await fetch(r.foto_url)
          if (resp.ok) {
            const blob = await resp.blob()
            carpetaFotos?.file(nombreArchivo, blob)
          } else {
            fallidas++
          }
        } catch {
          fallidas++
        }
      } else {
        fallidas++
      }

      const fila = [
        r.id_unico ?? r.id,
        `fotos/${nombreArchivo}`,
        r.ciudad,
        r.campana_id ? mapaCampanas[r.campana_id] ?? '' : '',
        r.direccion_calle ?? '',
        r.referencia ?? '',
        r.soporte ?? '',
        r.tecnica ?? '',
        r.funcion ?? '',
        r.estado_conservacion ?? '',
        r.presencia_serifas ?? '',
        r.grosor_trazo ?? '',
        r.estilo_general ?? '',
        r.texto_principal ?? '',
        r.origen,
        mapaAutores[r.usuario_id] ?? '',
        new Date(r.fecha_registro).toLocaleDateString('es-BO'),
      ]
        .map(escaparCsv)
        .join(',')
      filasCsv.push(fila)
    }

    setProgreso('Armando el archivo final…')

    zip.file('fichas.csv', '\uFEFF' + filasCsv.join('\n')) // BOM para que Excel/InDesign lean bien los acentos
    zip.file('LEEME.txt', README_TXT)

    const contenido = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(contenido)
    const a = document.createElement('a')
    const fecha = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `explorando-letras-export-${fecha}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    setProgreso(
      fallidas > 0
        ? `Listo, con ${fallidas} foto${fallidas === 1 ? '' : 's'} que no se pudo${fallidas === 1 ? '' : 'ieron'} descargar.`
        : 'Listo — el archivo se descargó.',
    )
    setGenerando(false)
  }

  return (
    <div>
      <div className="el-field">
        <label className="el-label">Campaña</label>
        <select className="el-select" value={campanaId} onChange={(e) => setCampanaId(e.target.value)}>
          <option value="">Todas las campañas</option>
          {campanas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="el-field">
        <label className="el-label">Origen</label>
        <select
          className="el-select"
          value={origen}
          onChange={(e) => setOrigen(e.target.value as typeof origen)}
        >
          <option value="todos">Investigación + Personal</option>
          <option value="investigacion">Solo investigación</option>
          <option value="personal">Solo personal</option>
        </select>
      </div>

      {conteoPrevio !== null && (
        <p className="el-hint" style={{ marginBottom: 14 }}>
          {conteoPrevio === 0
            ? 'No hay piezas validadas con estos filtros todavía.'
            : `Este paquete va a incluir ${conteoPrevio} pieza${conteoPrevio === 1 ? '' : 's'} validada${conteoPrevio === 1 ? '' : 's'}.`}
        </p>
      )}

      {error && <div className="el-error">{error}</div>}

      <button
        type="button"
        className="el-btn el-btn-primary"
        disabled={generando || conteoPrevio === 0}
        onClick={generarPaquete}
      >
        {generando ? progreso ?? 'Generando…' : 'Descargar paquete (fotos + CSV)'}
      </button>

      {generando && progreso && (
        <p className="el-hint" style={{ marginTop: 8 }}>
          {progreso} No cierres esta pantalla.
        </p>
      )}

      <div className="el-card" style={{ marginTop: 20 }}>
        <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 8px' }}>¿Qué trae el paquete?</p>
        <p className="el-admin-linea">
          Una carpeta <strong>fotos</strong> con la imagen de cada pieza (nombrada con su ID único), y un
          archivo <strong>fichas.csv</strong> con todos los datos de cada una en una fila.
        </p>
        <p className="el-admin-linea" style={{ marginTop: 8 }}>
          El CSV está preparado para usarse directo con la función <strong>Combinación de datos</strong>{' '}
          (Data Merge) de Adobe InDesign: armás una plantilla de página una sola vez, y InDesign genera
          automáticamente una página por cada pieza, con su foto y sus datos ya puestos en el lugar
          correcto. Las instrucciones exactas vienen en el archivo LEEME.txt dentro del paquete.
        </p>
      </div>
    </div>
  )
}
