import { useState } from 'react'
import { MapaPage } from './MapaPage'
import { GaleriaPage } from './GaleriaPage'

const CLAVE_INTRO_VISTA = 'el_intro_vista'

interface Props {
  onRegistrar: () => void
}

export function ExplorarPage({ onRegistrar }: Props) {
  const [vista, setVista] = useState<'mapa' | 'galeria'>('galeria')
  const [mostrarIntro, setMostrarIntro] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(CLAVE_INTRO_VISTA) !== 'true',
  )

  function cerrarIntro() {
    setMostrarIntro(false)
    try {
      localStorage.setItem(CLAVE_INTRO_VISTA, 'true')
    } catch {
      // si el navegador bloquea localStorage, no pasa nada grave
    }
  }

  return (
    <>
      {mostrarIntro && (
        <div
          className="el-card"
          style={{
            margin: '12px 16px 0',
            background: 'rgba(249, 178, 51, 0.10)',
            border: '1px solid rgba(249, 178, 51, 0.35)',
          }}
        >
          <p style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 700 }}>¿Qué es Explorando Letras?</p>
          <p style={{ margin: '0 0 14px', fontSize: 16, lineHeight: 1.6 }}>
            Es un proyecto para guardar la memoria de las letras hechas a mano que hay en la ciudad:
            carteles antiguos, nombres de negocios pintados a mano, avisos escritos en las paredes. Con el
            tiempo se van perdiendo, así que las estamos fotografiando y guardando en un archivo antes de
            que desaparezcan.
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>¿Qué podés hacer acá?</p>
          <p style={{ margin: '0 0 4px', fontSize: 16, lineHeight: 1.6 }}>
            1. Mirar todo lo que ya se registró, en la galería de fotos o en el mapa.
          </p>
          <p style={{ margin: '0 0 4px', fontSize: 16, lineHeight: 1.6 }}>
            2. Si querés, podés sumar tus propias fotos. Para eso hace falta crear una cuenta gratis —
            tocá "Registrar" abajo cuando quieras empezar.
          </p>
          <button type="button" className="el-btn el-btn-ghost" style={{ marginTop: 12 }} onClick={cerrarIntro}>
            Entendido, no mostrar de nuevo
          </button>
        </div>
      )}

      {!mostrarIntro && (
        <div style={{ margin: '10px 16px 0', textAlign: 'center' }}>
          <button
            type="button"
            className="el-btn el-btn-ghost"
            style={{ width: 'auto', padding: '6px 14px', fontSize: 13 }}
            onClick={() => setMostrarIntro(true)}
          >
            ¿Qué es esta página?
          </button>
        </div>
      )}

      <div className="el-admin-tabs" style={{ margin: '12px 16px 0' }}>
        <button
          type="button"
          className={`el-admin-tab ${vista === 'galeria' ? 'el-admin-tab-activo' : ''}`}
          onClick={() => setVista('galeria')}
        >
          Ver en galería
        </button>
        <button
          type="button"
          className={`el-admin-tab ${vista === 'mapa' ? 'el-admin-tab-activo' : ''}`}
          onClick={() => setVista('mapa')}
        >
          Ver en el mapa
        </button>
      </div>

      {vista === 'mapa' ? <MapaPage onRegistrar={onRegistrar} /> : <GaleriaPage onRegistrar={onRegistrar} />}
    </>
  )
}
