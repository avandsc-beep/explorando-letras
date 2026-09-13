interface IconProps {
  size?: number
}

export function IconExplorar({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M15 9l-2 5-5 2 2-5 5-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export function IconRegistrar({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export function IconMisRegistros({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.7" />
      <line x1="8" y1="14" x2="13" y2="14" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export function IconCuenta({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 20c0-3.8 3.2-6 7-6s7 2.2 7 6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export function IconCamara({ size = 26, color = '#fff' }: IconProps & { color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke={color} strokeWidth="1.6" />
      <circle cx="12" cy="13.5" r="3.6" stroke={color} strokeWidth="1.6" />
      <rect x="8.5" y="4" width="7" height="3" rx="1" stroke={color} strokeWidth="1.6" />
    </svg>
  )
}

export function IconUbicacion({ size = 26, color = '#fff' }: IconProps & { color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="10" r="3.4" stroke={color} strokeWidth="1.6" />
      <path d="M12 21c4-5 7-8.5 7-12a7 7 0 10-14 0c0 3.5 3 7 7 12z" stroke={color} strokeWidth="1.6" />
    </svg>
  )
}

export function IconArchivo({ size = 26, color = '#fff' }: IconProps & { color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="1.6" />
      <line x1="8" y1="10" x2="16" y2="10" stroke={color} strokeWidth="1.6" />
      <line x1="8" y1="14" x2="13" y2="14" stroke={color} strokeWidth="1.6" />
    </svg>
  )
}

export function IconCuentaGrande({ size = 34, color = '#f9b233' }: IconProps & { color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.6" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" stroke={color} strokeWidth="1.6" />
    </svg>
  )
}
