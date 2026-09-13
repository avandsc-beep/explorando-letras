import { useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'

type Modo = 'login' | 'registro' | 'recuperar'

export function LoginPage() {
  const { iniciarSesionConEmail, registrarseConEmail, iniciarSesionConGoogle, recuperarContrasena } = useAuth()
  const [modo, setModo] = useState<Modo>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [nombrePublico, setNombrePublico] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensajeOk, setMensajeOk] = useState<string | null>(null)

  function cambiarModo(nuevoModo: Modo) {
    setModo(nuevoModo)
    setError(null)
    setMensajeOk(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMensajeOk(null)
    setCargando(true)

    if (modo === 'recuperar') {
      const { error } = await recuperarContrasena(email)
      if (error) {
        setError(error)
      } else {
        setMensajeOk('Listo. Revisá tu correo — te mandamos instrucciones para elegir una contraseña nueva.')
      }
      setCargando(false)
      return
    }

    if (modo === 'login') {
      const { error } = await iniciarSesionConEmail(email, password)
      if (error) setError(error)
    } else {
      if (nombrePublico.trim().length < 2) {
        setError('Ingresá un nombre público (se mostrará en tus aportes).')
        setCargando(false)
        return
      }
      if (password !== confirmarPassword) {
        setError('Las dos contraseñas no son iguales. Revisalas y volvé a intentar.')
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
    <>
      <div className="el-card">
        <h1 className="el-title">
          {modo === 'login' ? 'Ingresar' : modo === 'registro' ? 'Crear cuenta' : 'Recuperar contraseña'}
        </h1>
        <p className="el-subtitle">
          {modo === 'login'
            ? 'Ingresá con tu cuenta para empezar a registrar letras en el mapa.'
            : modo === 'registro'
              ? 'Creá tu cuenta gratis para empezar a sumar letras al mapa.'
              : 'Escribí el email con el que te registraste y te mandamos instrucciones para elegir una contraseña nueva.'}
        </p>

        {error && <div className="el-error">{error}</div>}
        {mensajeOk && (
          <div
            className="el-error"
            style={{ borderColor: 'var(--leaf)', color: 'var(--leaf)', background: 'rgba(90,156,74,0.12)' }}
          >
            {mensajeOk}
          </div>
        )}

        {modo !== 'recuperar' && (
          <>
            <button type="button" className="el-btn el-btn-google" onClick={() => iniciarSesionConGoogle()}>
              <GoogleIcon />
              Continuar con Google
            </button>

            <div className="el-divider-text">o con email</div>
          </>
        )}

        <form onSubmit={onSubmit}>
          {modo === 'registro' && (
            <div className="el-field">
              <label className="el-label" htmlFor="nombre">Nombre público</label>
              <p className="el-hint" style={{ marginTop: -4, marginBottom: 6 }}>
                El nombre con el que vas a aparecer en tus aportes. Puede ser tu nombre real o un apodo.
              </p>
              <input
                id="nombre"
                className="el-input"
                type="text"
                placeholder="Ej. María López"
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

          {modo !== 'recuperar' && (
            <>
              <div className="el-field">
                <label className="el-label" htmlFor="password">Contraseña</label>
                {modo === 'registro' && (
                  <p className="el-hint" style={{ marginTop: -4, marginBottom: 6 }}>
                    Tiene que tener al menos 6 caracteres.
                  </p>
                )}
                <input
                  id="password"
                  className="el-input"
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {modo === 'registro' && (
                <div className="el-field">
                  <label className="el-label" htmlFor="password2">Repetí la contraseña</label>
                  <input
                    id="password2"
                    className="el-input"
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                  />
                </div>
              )}

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 15,
                  color: 'var(--paper-dim)',
                  marginBottom: 16,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={mostrarPassword}
                  onChange={(e) => setMostrarPassword(e.target.checked)}
                />
                Mostrar la contraseña mientras escribo
              </label>
            </>
          )}

          <button type="submit" className="el-btn el-btn-primary" disabled={cargando}>
            {cargando
              ? 'Un momento…'
              : modo === 'login'
                ? 'Ingresar'
                : modo === 'registro'
                  ? 'Crear cuenta'
                  : 'Enviar instrucciones'}
          </button>
        </form>

        {modo === 'login' && (
          <div className="el-link-row">
            <button onClick={() => cambiarModo('recuperar')}>¿Olvidaste tu contraseña?</button>
          </div>
        )}

        <div className="el-link-row">
          {modo === 'login' ? (
            <>¿No tenés cuenta? <button onClick={() => cambiarModo('registro')}>Registrate</button></>
          ) : (
            <>¿Ya tenés cuenta? <button onClick={() => cambiarModo('login')}>Ingresá</button></>
          )}
        </div>
      </div>
    </>
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
