import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/Auth/LoginPage'
import { CapturePage } from './pages/CapturePage'
import { MapaPage } from './pages/MapaPage'

type Vista = 'mapa' | 'registrar'

function AppContenido() {
  const { user, perfil, cargando, cerrarSesion } = useAuth()
  const [vista, setVista] = useState<Vista>('mapa')

  if (cargando) {
    return (
      <div className="el-main">
        <p className="el-hint">Cargando…</p>
      </div>
    )
  }

  return (
    <div className="el-app">
      <header className="el-header">
        <div className="el-brand">
          Explorando<span>Letras</span>
        </div>
        {user && (
          <button
            type="button"
            className="el-btn el-btn-danger"
            style={{ width: 'auto', padding: '8px 14px', fontSize: 14 }}
            onClick={() => cerrarSesion()}
          >
            {perfil?.nombre_publico ?? 'Salir'}
          </button>
        )}
      </header>

      {!user ? (
        <LoginPage />
      ) : (
        <>
          <div className="el-vista-contenido">
            {vista === 'mapa' ? <MapaPage /> : <CapturePage />}
          </div>

          <nav className="el-tabbar">
            <button
              type="button"
              className={`el-tab ${vista === 'mapa' ? 'el-tab-activo' : ''}`}
              onClick={() => setVista('mapa')}
            >
              <span className="el-tab-icono">🗺️</span>
              Mapa
            </button>
            <button
              type="button"
              className={`el-tab ${vista === 'registrar' ? 'el-tab-activo' : ''}`}
              onClick={() => setVista('registrar')}
            >
              <span className="el-tab-icono">📍</span>
              Registrar
            </button>
          </nav>
        </>
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContenido />
    </AuthProvider>
  )
}

export default App
