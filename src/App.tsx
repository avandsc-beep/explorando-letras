import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/Auth/LoginPage'
import { CapturePage } from './pages/CapturePage'
import { ExplorarPage } from './pages/ExplorarPage'
import { AdminPage } from './pages/AdminPage'
import { MisRegistrosPage } from './pages/MisRegistrosPage'

type Vista = 'mapa' | 'registrar' | 'mis-registros' | 'admin'

function AppContenido() {
  const { user, perfil, cargando, cerrarSesion } = useAuth()
  const [vista, setVista] = useState<Vista>('mapa')

  const esAdmin = perfil?.rol === 'admin' || perfil?.rol === 'moderador'

  if (cargando) {
    return (
      <div className="el-main">
        <p className="el-hint">Cargando…</p>
      </div>
    )
  }

  // El mapa es público: cualquier persona puede verlo sin necesidad de una cuenta.
  // Registrar, ver "Mis registros" y administrar sí requieren haber ingresado.
  function contenidoPrincipal() {
    if (vista === 'mapa') return <ExplorarPage />
    if (!user) return <LoginPage />
    if (vista === 'registrar') return <CapturePage onGuardado={() => setVista('mis-registros')} />
    if (vista === 'mis-registros') return <MisRegistrosPage />
    if (vista === 'admin' && esAdmin) return <AdminPage />
    return <ExplorarPage />
  }

  return (
    <div className="el-app">
      <header className="el-header">
        <div className="el-brand">
          Explorando<span>Letras</span>
        </div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="el-hint" style={{ margin: 0 }}>{perfil?.nombre_publico}</span>
            <button
              type="button"
              className="el-btn el-btn-danger"
              style={{ width: 'auto', padding: '8px 14px', fontSize: 14 }}
              onClick={() => cerrarSesion()}
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="el-btn el-btn-primary"
            style={{ width: 'auto', padding: '8px 14px', fontSize: 14 }}
            onClick={() => setVista('registrar')}
          >
            Ingresar
          </button>
        )}
      </header>

      <div className="el-vista-contenido">{contenidoPrincipal()}</div>

      <nav className="el-tabbar">
        <button
          type="button"
          className={`el-tab ${vista === 'mapa' ? 'el-tab-activo' : ''}`}
          onClick={() => setVista('mapa')}
        >
          Explorar
        </button>
        <button
          type="button"
          className={`el-tab ${vista === 'registrar' ? 'el-tab-activo' : ''}`}
          onClick={() => setVista('registrar')}
        >
          Registrar
        </button>
        <button
          type="button"
          className={`el-tab ${vista === 'mis-registros' ? 'el-tab-activo' : ''}`}
          onClick={() => setVista('mis-registros')}
        >
          Mis registros
        </button>
        {user && esAdmin && (
          <button
            type="button"
            className={`el-tab ${vista === 'admin' ? 'el-tab-activo' : ''}`}
            onClick={() => setVista('admin')}
          >
            Administrar
          </button>
        )}
      </nav>
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
