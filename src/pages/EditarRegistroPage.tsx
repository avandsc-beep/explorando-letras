import { useState } from 'react'
import { supabase, type Registro } from '../lib/supabase'
import { ClasificacionForm, type DatosClasificacion } from '../components/Capture/ClasificacionForm'

interface Props {
  registro: Registro
  onCancelar: () => void
  onGuardado: () => void
}

export function EditarRegistroPage({ registro, onCancelar, onGuardado }: Props) {
  const [valores, setValores] = useState<DatosClasificacion>({
    ciudad: registro.ciudad ?? '',
    direccion_calle: registro.direccion_calle ?? '',
    referencia: registro.referencia ?? '',
    soporte: registro.soporte ?? '',
    tecnica: registro.tecnica ?? '',
    funcion: registro.funcion ?? '',
    estado_conservacion: registro.estado_conservacion ?? '',
    presencia_serifas: registro.presencia_serifas ?? '',
    grosor_trazo: registro.grosor_trazo ?? '',
    estilo_general: registro.estilo_general ?? '',
    texto_principal: registro.texto_principal ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function esFichaMinimaCompleta() {
    return (
      valores.ciudad.trim() !== '' && valores.soporte !== '' && valores.tecnica !== '' && valores.funcion !== ''
    )
  }

  async function guardar(estadoFinal: 'borrador' | 'completa') {
    if (estadoFinal === 'completa' && !esFichaMinimaCompleta()) {
      setError(
        'Para marcar como completa, necesitás al menos: ciudad, soporte, técnica y función. Completá esos campos o guardá como borrador.',
      )
      return
    }

    setGuardando(true)
    setError(null)

    const { error: errUpdate } = await supabase
      .from('registros')
      .update({
        ciudad: valores.ciudad.trim(),
        direccion_calle: valores.direccion_calle || null,
        referencia: valores.referencia || null,
        soporte: valores.soporte || null,
        tecnica: valores.tecnica || null,
        funcion: valores.funcion || null,
        estado_conservacion: valores.estado_conservacion || null,
        presencia_serifas: valores.presencia_serifas || null,
        grosor_trazo: valores.grosor_trazo || null,
        estilo_general: valores.estilo_general || null,
        texto_principal: valores.texto_principal || null,
        estado: estadoFinal,
      })
      .eq('id', registro.id)

    if (errUpdate) {
      setError('No se pudo guardar: ' + errUpdate.message)
      setGuardando(false)
      return
    }

    onGuardado()
  }

  return (
    <div className="el-main">
      <div className="el-card">
        <h1 className="el-title">Completar registro</h1>
        <p className="el-subtitle">
          Este registro quedó guardado como borrador. Completá lo que falte y enviálo cuando esté listo.
        </p>

        {registro.foto_url && (
          <img
            src={registro.foto_url}
            alt=""
            style={{ width: '100%', borderRadius: 8, marginBottom: 14 }}
          />
        )}

        {error && <div className="el-error">{error}</div>}

        <ClasificacionForm valores={valores} onChange={setValores} />

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="button" className="el-btn el-btn-ghost" disabled={guardando} onClick={onCancelar}>
            Volver
          </button>
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
            disabled={guardando || !esFichaMinimaCompleta()}
            onClick={() => guardar('completa')}
          >
            {guardando ? 'Guardando…' : 'Marcar como completa'}
          </button>
        </div>
        <p className="el-hint">
          {esFichaMinimaCompleta()
            ? ''
            : 'Para marcar como completa, como mínimo completá: ciudad, soporte, técnica y función.'}
        </p>
      </div>
    </div>
  )
}
