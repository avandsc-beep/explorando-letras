import { useState } from 'react'
import { MapaPage } from './MapaPage'
import { GaleriaPage } from './GaleriaPage'

export function ExplorarPage() {
  const [vista, setVista] = useState<'mapa' | 'galeria'>('mapa')

  return (
    <>
      <div className="el-admin-tabs" style={{ margin: '12px 16px 0' }}>
        <button
          type="button"
          className={`el-admin-tab ${vista === 'mapa' ? 'el-admin-tab-activo' : ''}`}
          onClick={() => setVista('mapa')}
        >
          Ver en el mapa
        </button>
        <button
          type="button"
          className={`el-admin-tab ${vista === 'galeria' ? 'el-admin-tab-activo' : ''}`}
          onClick={() => setVista('galeria')}
        >
          Ver en galería
        </button>
      </div>

      {vista === 'mapa' ? <MapaPage /> : <GaleriaPage />}
    </>
  )
}
