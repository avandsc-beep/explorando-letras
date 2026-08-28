import { useEffect, useState } from 'react'
import { supabase, type Lexico } from '../../lib/supabase'

export interface DatosClasificacion {
  ciudad: string
  direccion_calle: string
  referencia: string
  soporte: string
  tecnica: string
  funcion: string
  estado_conservacion: string
  presencia_serifas: string
  grosor_trazo: string
  estilo_general: string
  texto_principal: string
}

const ESTADOS_CONSERVACION = ['Bueno', 'Regular', 'Malo', 'En riesgo']
const OPCIONES_SERIFAS = ['Con serifas', 'Sin serifas (paloseco)', 'Mixta']
const OPCIONES_GROSOR = ['Fino', 'Medio', 'Grueso', 'Variable']

interface Props {
  valores: DatosClasificacion
  onChange: (v: DatosClasificacion) => void
}

export function ClasificacionForm({ valores, onChange }: Props) {
  const [lexicos, setLexicos] = useState<Lexico[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase
      .from('lexicos')
      .select('*')
      .eq('activo', true)
      .then(({ data }) => {
        setLexicos((data as Lexico[]) ?? [])
        setCargando(false)
      })
  }, [])

  function opciones(categoria: Lexico['categoria']) {
    return lexicos.filter((l) => l.categoria === categoria).map((l) => l.valor)
  }

  function set<K extends keyof DatosClasificacion>(campo: K, valor: DatosClasificacion[K]) {
    onChange({ ...valores, [campo]: valor })
  }

  return (
    <div>
      {/* Bloque 1 — Identificación */}
      <fieldset style={bloqueStyle}>
        <legend style={legendStyle}>1. Identificación y ubicación</legend>
        <div className="el-field">
          <label className="el-label">Ciudad</label>
          <input
            className="el-input"
            value={valores.ciudad}
            onChange={(e) => set('ciudad', e.target.value)}
            placeholder="Santa Cruz de la Sierra"
          />
        </div>
        <div className="el-field">
          <label className="el-label">Calle</label>
          <input
            className="el-input"
            value={valores.direccion_calle}
            onChange={(e) => set('direccion_calle', e.target.value)}
            placeholder="Ej. Junín entre Bolívar y Sucre"
          />
        </div>
        <div className="el-field">
          <label className="el-label">Referencia</label>
          <input
            className="el-input"
            value={valores.referencia}
            onChange={(e) => set('referencia', e.target.value)}
            placeholder="Ej. Frente a la Plazuela Callejas"
          />
        </div>
      </fieldset>

      {/* Bloque 2 — Descripción */}
      <fieldset style={bloqueStyle}>
        <legend style={legendStyle}>2. Descripción de la letragrafía</legend>
        <SelectLexico
          etiqueta="Soporte"
          valor={valores.soporte}
          opciones={opciones('soporte')}
          cargando={cargando}
          onChange={(v) => set('soporte', v)}
        />
        <SelectLexico
          etiqueta="Técnica"
          valor={valores.tecnica}
          opciones={opciones('tecnica')}
          cargando={cargando}
          onChange={(v) => set('tecnica', v)}
        />
        <SelectLexico
          etiqueta="Función"
          valor={valores.funcion}
          opciones={opciones('funcion')}
          cargando={cargando}
          onChange={(v) => set('funcion', v)}
        />
      </fieldset>

      {/* Bloque 3 — Datos técnicos */}
      <fieldset style={bloqueStyle}>
        <legend style={legendStyle}>3. Datos técnicos</legend>
        <SelectLexico
          etiqueta="Estado de conservación"
          valor={valores.estado_conservacion}
          opciones={ESTADOS_CONSERVACION}
          cargando={false}
          onChange={(v) => set('estado_conservacion', v)}
        />
      </fieldset>

      {/* Bloque morfológico */}
      <fieldset style={bloqueStyle}>
        <legend style={legendStyle}>Análisis morfológico</legend>
        <SelectLexico
          etiqueta="Presencia de serifas"
          valor={valores.presencia_serifas}
          opciones={OPCIONES_SERIFAS}
          cargando={false}
          onChange={(v) => set('presencia_serifas', v)}
        />
        <SelectLexico
          etiqueta="Grosor de trazo"
          valor={valores.grosor_trazo}
          opciones={OPCIONES_GROSOR}
          cargando={false}
          onChange={(v) => set('grosor_trazo', v)}
        />
        <SelectLexico
          etiqueta="Estilo general"
          valor={valores.estilo_general}
          opciones={opciones('estilo_general')}
          cargando={cargando}
          onChange={(v) => set('estilo_general', v)}
        />
        <div className="el-field">
          <label className="el-label">Texto principal de la pieza</label>
          <textarea
            className="el-textarea"
            value={valores.texto_principal}
            onChange={(e) => set('texto_principal', e.target.value)}
            placeholder="Transcribí el texto tal como aparece"
          />
        </div>
      </fieldset>
    </div>
  )
}

function SelectLexico({
  etiqueta,
  valor,
  opciones,
  cargando,
  onChange,
}: {
  etiqueta: string
  valor: string
  opciones: string[]
  cargando: boolean
  onChange: (v: string) => void
}) {
  return (
    <div className="el-field">
      <label className="el-label">{etiqueta}</label>
      <select
        className="el-select"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        disabled={cargando}
      >
        <option value="">{cargando ? 'Cargando…' : 'Seleccionar…'}</option>
        {opciones.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

const bloqueStyle: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--ink-line)',
  padding: '16px 0 4px',
  margin: 0,
}

const legendStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--ochre)',
  padding: 0,
  marginBottom: 10,
}
