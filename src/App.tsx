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
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [mostrarInfoProyecto, setMostrarInfoProyecto] = useState(false)

  const esAdmin = perfil?.rol === 'admin' || perfil?.rol === 'moderador'

  if (cargando) {
    return (
      <div className="el-main">
        <p className="el-hint">Cargando…</p>
      </div>
    )
  }

  function irA(v: Vista) {
    setVista(v)
    setMenuAbierto(false)
  }

  // El mapa es público: cualquier persona puede verlo sin necesidad de una cuenta.
  // Registrar, ver "Mis registros" y administrar sí requieren haber ingresado.
  function contenidoPrincipal() {
    if (vista === 'mapa') return <ExplorarPage onRegistrar={() => irA('registrar')} />
    if (!user) return <LoginPage />
    if (vista === 'registrar') return <CapturePage onGuardado={() => setVista('mis-registros')} />
    if (vista === 'mis-registros') return <MisRegistrosPage />
    if (vista === 'admin' && esAdmin) return <AdminPage />
    return <ExplorarPage onRegistrar={() => irA('registrar')} />
  }

  return (
    <div className="el-app">
      <header className="el-header">
        <button type="button" className="el-brand" onClick={() => irA('mapa')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
          <img
            src="/assets/logo-letras-solo.png"
            alt="Explorando Letras"
            style={{ height: 30, width: 'auto', display: 'block' }}
          />
        </button>

        <button
          type="button"
          className="el-btn-menu"
          onClick={() => setMenuAbierto((v) => !v)}
          aria-expanded={menuAbierto}
        >
          Menú
        </button>
      </header>

      {menuAbierto && (
        <>
          <div className="el-menu-overlay" onClick={() => setMenuAbierto(false)} />
          <nav className="el-menu-panel">
            <button type="button" className={`el-menu-item ${vista === 'mapa' ? 'el-menu-item-activo' : ''}`} onClick={() => irA('mapa')}>
              Explorar
            </button>
            <button type="button" className={`el-menu-item ${vista === 'registrar' ? 'el-menu-item-activo' : ''}`} onClick={() => irA('registrar')}>
              Registrar
            </button>
            <button type="button" className={`el-menu-item ${vista === 'mis-registros' ? 'el-menu-item-activo' : ''}`} onClick={() => irA('mis-registros')}>
              Mis registros
            </button>
            {user && esAdmin && (
              <button type="button" className={`el-menu-item ${vista === 'admin' ? 'el-menu-item-activo' : ''}`} onClick={() => irA('admin')}>
                Administrar
              </button>
            )}
            <div className="el-menu-divisor" />
            <button
              type="button"
              className="el-menu-item"
              onClick={() => {
                setMostrarInfoProyecto(true)
                setMenuAbierto(false)
              }}
            >
              ¿Qué es este proyecto?
            </button>
            <div className="el-menu-divisor" />
            {user ? (
              <>
                <p className="el-menu-usuario">Conectado como {perfil?.nombre_publico}</p>
                <button
                  type="button"
                  className="el-menu-item"
                  onClick={() => {
                    cerrarSesion()
                    setMenuAbierto(false)
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button type="button" className="el-menu-item" onClick={() => irA('registrar')}>
                Ingresar / Crear cuenta
              </button>
            )}
          </nav>
        </>
      )}

      <div className="el-vista-contenido">{contenidoPrincipal()}</div>

      {mostrarInfoProyecto && (
        <div className="el-modal-overlay" onClick={() => setMostrarInfoProyecto(false)}>
          <div className="el-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 20 }}>
              <p style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700 }}>¿Qué es Explorando Letras?</p>
              <p style={{ margin: '0 0 14px', fontSize: 16, lineHeight: 1.6 }}>
                Es un proyecto para guardar la memoria de las letras hechas a mano que hay en la ciudad:
                carteles antiguos, nombres de negocios pintados a mano, avisos escritos en las paredes. Con
                el tiempo se van perdiendo, así que las estamos fotografiando y guardando en un archivo
                antes de que desaparezcan.
              </p>
              <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>¿Qué podés hacer acá?</p>
              <p style={{ margin: '0 0 4px', fontSize: 16, lineHeight: 1.6 }}>
                1. Mirar todo lo que ya se registró, en el mapa o en la galería de fotos.
              </p>
              <p style={{ margin: '0 0 14px', fontSize: 16, lineHeight: 1.6 }}>
                2. Si querés, podés sumar tus propias fotos — hace falta crear una cuenta gratis, desde
                "Registrar" en el menú.
              </p>
              <button type="button" className="el-btn el-btn-ghost" onClick={() => setMostrarInfoProyecto(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
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
