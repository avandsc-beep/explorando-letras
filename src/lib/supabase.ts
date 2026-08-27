import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (revisá el archivo .env)'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ---- Tipos del modelo de datos (reflejan supabase/schema.sql) ----

export type Rol = 'admin' | 'moderador' | 'investigador' | 'ciudadano'

export interface Perfil {
  id: string
  nombre_publico: string
  rol: Rol
  creado_en: string
}

export type EstadoRegistro =
  | 'borrador'
  | 'completa'
  | 'pendiente_revision'
  | 'validada'
  | 'rechazada'

export type Origen = 'investigacion' | 'personal'

export interface Registro {
  id: string
  id_unico: string | null
  ciudad: string
  campana_id: string | null
  espacio_id: string | null
  origen: Origen
  informe_id: string | null
  usuario_id: string
  equipo_id: string | null
  latitud: number
  longitud: number
  precision_gps_metros: number | null
  direccion_calle: string | null
  referencia: string | null
  foto_url: string | null
  soporte: string | null
  tecnica: string | null
  funcion: string | null
  estado_conservacion: string | null
  presencia_serifas: string | null
  grosor_trazo: string | null
  estilo_general: string | null
  texto_principal: string | null
  estado: EstadoRegistro
  notas_admin: string | null
  fecha_registro: string
  fecha_validacion: string | null
}

export interface Lexico {
  id: string
  categoria: 'soporte' | 'tecnica' | 'funcion' | 'estilo_general'
  valor: string
  activo: boolean
}
