import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { LoginPage } from '../components/Auth/LoginPage'

export function CuentaPage({ onAdministrar }: { onAdministrar: () => void }) {
  const { user, perfil, cerrarSesion } = useAuth()
  const [cantidadRegistros, setCantidadRegistros] = useState<number | null>(null)

  const esAdmin = perfil?.rol === 'admin' || perfil?.rol === 'moderador'

  useEffect(() => {
    if (!user) return
    supabase
      .from('registros')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .then(({ count }) => setCantidadRegistros(count ?? 0))
  }, [user])

  if (!user) {
    return (
      <div className="el-main">
        <div
          className="el-card"
          style={{
            marginBottom: 16,
            background: 'rgba(249, 178, 51, 0.10)',
            border: '1px solid rgba(249, 178, 51, 0.35)',
          }}
        >
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
            Cualquiera puede mirar el mapa. Con una cuenta gratis podés sumar tus propias fotos al archivo.
          </p>
        </div>
        <LoginPage />
      </div>
    )
  }

  const inicial = (perfil?.nombre_publico ?? '?').trim().charAt(0).toUpperCase()

  return (
    <div className="el-main">
      <div className="el-card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--magenta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--ink)',
          }}
        >
          {inicial}
        </div>
        <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>{perfil?.nombre_publico}</p>
        <p className="el-hint" style={{ margin: 0 }}>
          {cantidadRegistros === null ? 'Cargando…' : `${cantidadRegistros} pieza${cantidadRegistros === 1 ? '' : 's'} registrada${cantidadRegistros === 1 ? '' : 's'}`}
        </p>
      </div>
      {esAdmin && (
        <button type="button" className="el-btn el-btn-ghost" style={{ marginBottom: 10 }} onClick={onAdministrar}>
          Administrar
        </button>
      )}
      <button type="button" className="el-btn el-btn-danger" onClick={() => cerrarSesion()}>
        Cerrar sesión
      </button>
    </div>
  )
}
