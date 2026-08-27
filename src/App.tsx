import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/Auth/LoginPage'
import { CapturePage } from './pages/CapturePage'

function AppContenido() {
  const { user, perfil, cargando, cerrarSesion } = useAuth()

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
            style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
            onClick={() => cerrarSesion()}
          >
            {perfil?.nombre_publico ?? 'Salir'}
          </button>
        )}
      </header>

      {user ? <CapturePage /> : <LoginPage />}
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
