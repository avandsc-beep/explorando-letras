import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CapturePage } from './pages/CapturePage'
import { ExplorarPage } from './pages/ExplorarPage'
import { AdminPage } from './pages/AdminPage'
import { MisRegistrosPage } from './pages/MisRegistrosPage'
import { CuentaPage } from './pages/CuentaPage'
import { OnboardingCarousel, onboardingYaVisto } from './components/OnboardingCarousel'
import { IconExplorar, IconRegistrar, IconMisRegistros, IconCuenta, IconCuentaGrande } from './components/Icons'

type Vista = 'explorar' | 'registrar' | 'mis-registros' | 'cuenta' | 'admin'

function TarjetaNecesitaCuenta({ titulo, texto, onIr }: { titulo: string; texto: string; onIr: () => void }) {
  return (
    <div className="el-main">
      <div className="el-card" style={{ textAlign: 'center', marginTop: 40 }}>
        <IconCuentaGrande />
        <p style={{ margin: '12px 0 6px', fontSize: 17, fontWeight: 700 }}>{titulo}</p>
        <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--paper-dim)', lineHeight: 1.5 }}>{texto}</p>
        <button type="button" className="el-btn el-btn-primary" onClick={onIr}>
          Ingresar / Crear cuenta
        </button>
      </div>
    </div>
  )
}

function AppContenido() {
  const { user, cargando } = useAuth()
  const [vista, setVista] = useState<Vista>('explorar')
  const [mostrarOnboarding, setMostrarOnboarding] = useState(() => !onboardingYaVisto())

  if (cargando) {
    return (
      <div className="el-main">
        <p className="el-hint">Cargando…</p>
      </div>
    )
  }

  if (mostrarOnboarding) {
    return (
      <div className="el-app">
        <OnboardingCarousel
          onExplorar={() => {
            setMostrarOnboarding(false)
            setVista('explorar')
          }}
          onRegistrar={() => {
            setMostrarOnboarding(false)
            setVista('registrar')
          }}
        />
      </div>
    )
  }

  function contenidoPrincipal() {
    if (vista === 'explorar') return <ExplorarPage onRegistrar={() => setVista('registrar')} />

    if (vista === 'registrar') {
      if (!user) {
        return (
          <TarjetaNecesitaCuenta
            titulo="Necesitás una cuenta gratis"
            texto="Es rápido y gratis — así tus fotos quedan asociadas a tu nombre en el archivo."
            onIr={() => setVista('cuenta')}
          />
        )
      }
      return <CapturePage onGuardado={() => setVista('mis-registros')} />
    }

    if (vista === 'mis-registros') {
      if (!user) {
        return (
          <TarjetaNecesitaCuenta
            titulo="Ingresá para ver tus registros"
            texto="Ahí vas a ver todo lo que registraste y en qué estado está."
            onIr={() => setVista('cuenta')}
          />
        )
      }
      return <MisRegistrosPage />
    }

    if (vista === 'admin') return <AdminPage />

    return <CuentaPage onAdministrar={() => setVista('admin')} />
  }

  return (
    <div className="el-app">
      <header className="el-header">
        <img
          src="/assets/logo-explorando-letras-full.png"
          alt="Explorando Letras"
          style={{ height: 28, width: 'auto', display: 'block' }}
        />
      </header>

      <div className="el-vista-contenido">{contenidoPrincipal()}</div>

      <nav className="el-tabbar-iconos">
        <button
          type="button"
          className={`el-tab-icono-btn ${vista === 'explorar' ? 'el-tab-icono-activo' : ''}`}
          onClick={() => setVista('explorar')}
        >
          <IconExplorar />
          <span>Explorar</span>
        </button>
        <button
          type="button"
          className={`el-tab-icono-btn ${vista === 'registrar' ? 'el-tab-icono-activo' : ''}`}
          onClick={() => setVista('registrar')}
        >
          <IconRegistrar />
          <span>Registrar</span>
        </button>
        <button
          type="button"
          className={`el-tab-icono-btn ${vista === 'mis-registros' ? 'el-tab-icono-activo' : ''}`}
          onClick={() => setVista('mis-registros')}
        >
          <IconMisRegistros />
          <span>Mis registros</span>
        </button>
        <button
          type="button"
          className={`el-tab-icono-btn ${vista === 'cuenta' || vista === 'admin' ? 'el-tab-icono-activo' : ''}`}
          onClick={() => setVista('cuenta')}
        >
          <IconCuenta />
          <span>Cuenta</span>
        </button>
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
