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
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: traducirErrorAuth(error.message) }

    if (data.user) {
      const { error: errorPerfil } = await supabase.from('perfiles').insert({
        id: data.user.id,
        nombre_publico: nombrePublico,
        rol: 'ciudadano',
      })
      if (errorPerfil) return { error: 'No se pudo crear el perfil: ' + errorPerfil.message }
    }
    return { error: null }
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
