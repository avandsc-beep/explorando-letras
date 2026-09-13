import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, type Perfil } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  perfil: Perfil | null
  cargando: boolean
  iniciarSesionConEmail: (email: string, password: string) => Promise<{ error: string | null }>
  registrarseConEmail: (
    email: string,
    password: string,
    nombrePublico: string
  ) => Promise<{ error: string | null }>
  iniciarSesionConGoogle: () => Promise<void>
  recuperarContrasena: (email: string) => Promise<{ error: string | null }>
  cerrarSesion: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)

  async function cargarPerfil(userId: string) {
    const { data } = await supabase.from('perfiles').select('*').eq('id', userId).maybeSingle()
    setPerfil(data as Perfil | null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) cargarPerfil(data.session.user.id)
      setCargando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        cargarPerfil(newSession.user.id)
      } else {
        setPerfil(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function iniciarSesionConEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? traducirErrorAuth(error.message) : null }
  }

  async function registrarseConEmail(email: string, password: string, nombrePublico: string) {
    // Le pasamos el nombre elegido como metadata del usuario: el trigger de la
    // base de datos (crear_perfil_automatico) lo toma de ahí para crear el
    // perfil correctamente desde el primer momento, sin un segundo paso que
    // podría chocar con las reglas de seguridad si el email no fue confirmado.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nombrePublico } },
    })
    if (error) return { error: traducirErrorAuth(error.message) }
    return { error: null }
  }

  async function recuperarContrasena(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    return { error: error ? traducirErrorAuth(error.message) : null }
  }

  async function iniciarSesionConGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        perfil,
        cargando,
        iniciarSesionConEmail,
        registrarseConEmail,
        iniciarSesionConGoogle,
        recuperarContrasena,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

function traducirErrorAuth(mensaje: string): string {
  if (mensaje.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (mensaje.includes('User already registered')) return 'Ya existe una cuenta con ese email.'
  if (mensaje.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (mensaje.includes('Unable to validate email')) return 'El formato del email no es válido.'
  return mensaje
}
