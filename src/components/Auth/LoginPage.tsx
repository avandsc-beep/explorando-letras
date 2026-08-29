import { useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export function LoginPage() {
  const { iniciarSesionConEmail, registrarseConEmail, iniciarSesionConGoogle } = useAuth()
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombrePublico, setNombrePublico] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensajeOk, setMensajeOk] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMensajeOk(null)
    setCargando(true)

    if (modo === 'login') {
      const { error } = await iniciarSesionConEmail(email, password)
      if (error) setError(error)
    } else {
      if (nombrePublico.trim().length < 2) {
        setError('Ingresá un nombre público (se mostrará en tus aportes).')
        setCargando(false)
        return
      }
      const { error } = await registrarseConEmail(email, password, nombrePublico.trim())
      if (error) {
        setError(error)
      } else {
        setMensajeOk('Cuenta creada. Revisá tu correo para confirmar el registro.')
      }
    }
    setCargando(false)
  }

  return (
    <div className="el-main">
      <div
        className="el-card"
        style={{
          marginBottom: 16,
          background: 'rgba(230, 56, 136, 0.08)',
          border: '1px solid rgba(230, 56, 136, 0.3)',
        }}
      >
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
          <strong>¿Qué es Explorando Letras?</strong> Es un proyecto para guardar la memoria de las
          letras hechas a mano que hay en la ciudad — carteles, nombres de negocios pintados, avisos
          escritos a mano. Cualquier persona puede sacarles una foto, anotar dónde están, y sumarlas a un
          mapa colectivo antes de que se pierdan.
        </p>
      </div>

      <div className="el-card">
        <h1 className="el-title">{modo === 'login' ? 'Ingresar' : 'Crear cuenta'}</h1>
        <p className="el-subtitle">
          {modo === 'login'
            ? 'Ingresá con tu cuenta para empezar a registrar letras en el mapa.'
            : 'Creá tu cuenta gratis para empezar a sumar letras al mapa.'}
        </p>

        {error && <div className="el-error">{error}</div>}
        {mensajeOk && <div className="el-error" style={{ borderColor: 'var(--leaf)', color: 'var(--leaf)', background: 'rgba(90,156,74,0.12)' }}>{mensajeOk}</div>}

        <button
          type="button"
          className="el-btn el-btn-google"
          onClick={() => iniciarSesionConGoogle()}
        >
          <GoogleIcon />
          Continuar con Google
        </button>

        <div className="el-divider-text">o con email</div>

        <form onSubmit={onSubmit}>
          {modo === 'registro' && (
            <div className="el-field">
              <label className="el-label" htmlFor="nombre">Nombre público</label>
              <input
                id="nombre"
                className="el-input"
                type="text"
                placeholder="Como querés aparecer en tus aportes"
                value={nombrePublico}
                onChange={(e) => setNombrePublico(e.target.value)}
              />
            </div>
          )}

          <div className="el-field">
            <label className="el-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="el-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="el-field">
            <label className="el-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="el-input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="el-btn el-btn-primary" disabled={cargando}>
            {cargando ? 'Un momento…' : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <div className="el-link-row">
          {modo === 'login' ? (
            <>¿No tenés cuenta? <button onClick={() => { setModo('registro'); setError(null) }}>Registrate</button></>
          ) : (
            <>¿Ya tenés cuenta? <button onClick={() => { setModo('login'); setError(null) }}>Ingresá</button></>
          )}
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 009 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.97H.98A9 9 0 000 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  )
}
