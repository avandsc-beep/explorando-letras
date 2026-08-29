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
        <legend style={legendStyle}>Dónde está</legend>
        <div className="el-field">
          <label className="el-label">Ciudad</label>
          <input
            className="el-input"
            value={valores.ciudad}
            onChange={(e) => set('ciudad', e.target.value)}
            placeholder="Ej. Santa Cruz de la Sierra"
          />
        </div>
        <div className="el-field">
          <label className="el-label">Calle</label>
          <p className="el-hint" style={{ marginTop: -4, marginBottom: 6 }}>
            Opcional. El nombre de la calle donde está, si lo sabés.
          </p>
          <input
            className="el-input"
            value={valores.direccion_calle}
            onChange={(e) => set('direccion_calle', e.target.value)}
            placeholder="Ej. Junín entre Bolívar y Sucre"
          />
        </div>
        <div className="el-field">
          <label className="el-label">Alguna referencia del lugar</label>
          <p className="el-hint" style={{ marginTop: -4, marginBottom: 6 }}>
            Opcional. Algo que ayude a ubicarlo, como un negocio cercano conocido.
          </p>
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
        <legend style={legendStyle}>Cómo está hecha</legend>
        <SelectLexico
          etiqueta="¿Sobre qué está hecha?"
          hint="La superficie donde está la letra: una pared, una puerta, un vidrio, etc."
          valor={valores.soporte}
          opciones={opciones('soporte')}
          cargando={cargando}
          onChange={(v) => set('soporte', v)}
        />
        <SelectLexico
          etiqueta="¿Cómo la hicieron?"
          hint="La forma en que se hizo la letra: a mano con pincel, con aerosol, con plantilla, etc."
          valor={valores.tecnica}
          opciones={opciones('tecnica')}
          cargando={cargando}
          onChange={(v) => set('tecnica', v)}
        />
        <SelectLexico
          etiqueta="¿Para qué sirve?"
          hint="Por ejemplo: el nombre de un negocio, un aviso, un número de casa."
          valor={valores.funcion}
          opciones={opciones('funcion')}
          cargando={cargando}
          onChange={(v) => set('funcion', v)}
        />
      </fieldset>

      {/* Bloque 3 — Datos técnicos */}
      <fieldset style={bloqueStyle}>
        <legend style={legendStyle}>Estado</legend>
        <SelectLexico
          etiqueta="¿Cómo se ve hoy?"
          hint="Si está bien conservada, deteriorada, o corre riesgo de desaparecer pronto."
          valor={valores.estado_conservacion}
          opciones={ESTADOS_CONSERVACION}
          cargando={false}
          onChange={(v) => set('estado_conservacion', v)}
        />
      </fieldset>

      {/* Bloque morfológico */}
      <fieldset style={bloqueStyle}>
        <legend style={legendStyle}>Sobre la forma de las letras</legend>
        <p className="el-hint" style={{ marginBottom: 10 }}>
          Estas preguntas son más técnicas. Si no sabés la respuesta, dejalas en blanco sin problema.
        </p>
        <SelectLexico
          etiqueta="¿Las letras tienen serifas?"
          hint='Las serifas son los pequeños remates en las puntas de las letras (como en "Times New Roman"). Si las letras son simples y sin adornos en las puntas, son "sin serifas".'
          valor={valores.presencia_serifas}
          opciones={OPCIONES_SERIFAS}
          cargando={false}
          onChange={(v) => set('presencia_serifas', v)}
        />
        <SelectLexico
          etiqueta="¿Qué tan grueso es el trazo?"
          hint="El grosor de la línea con la que está dibujada la letra."
          valor={valores.grosor_trazo}
          opciones={OPCIONES_GROSOR}
          cargando={false}
          onChange={(v) => set('grosor_trazo', v)}
        />
        <SelectLexico
          etiqueta="¿Cómo describirías el estilo?"
          hint="La sensación general que da: geométrica, manuscrita, decorativa, etc."
          valor={valores.estilo_general}
          opciones={opciones('estilo_general')}
          cargando={cargando}
          onChange={(v) => set('estilo_general', v)}
        />
        <div className="el-field">
          <label className="el-label">Copiá el texto que dice la letra</label>
          <p className="el-hint" style={{ marginTop: -4, marginBottom: 6 }}>
            Opcional. Escribí exactamente lo que dice, tal como está escrito.
          </p>
          <textarea
            className="el-textarea"
            value={valores.texto_principal}
            onChange={(e) => set('texto_principal', e.target.value)}
            placeholder="Ej. Panadería La Espiga"
          />
        </div>
      </fieldset>
    </div>
  )
}

function SelectLexico({
  etiqueta,
  hint,
  valor,
  opciones,
  cargando,
  onChange,
}: {
  etiqueta: string
  hint?: string
  valor: string
  opciones: string[]
  cargando: boolean
  onChange: (v: string) => void
}) {
  return (
    <div className="el-field">
      <label className="el-label">{etiqueta}</label>
      {hint && (
        <p className="el-hint" style={{ marginTop: -4, marginBottom: 6 }}>
          {hint}
        </p>
      )}
      <select
        className="el-select"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        disabled={cargando}
      >
        <option value="">{cargando ? 'Cargando…' : 'No lo sé / prefiero no responder'}</option>
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
  color: 'var(--magenta)',
  padding: 0,
  marginBottom: 10,
}
