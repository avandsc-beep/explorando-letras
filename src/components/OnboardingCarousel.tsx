import { useState } from 'react'

interface Props {
  onExplorar: () => void
  onRegistrar: () => void
}

const CLAVE_ONBOARDING_VISTO = 'el_onboarding_visto'

export function marcarOnboardingVisto() {
  try {
    localStorage.setItem(CLAVE_ONBOARDING_VISTO, 'true')
  } catch {
    // si el navegador bloquea localStorage, no pasa nada grave
  }
}

export function onboardingYaVisto(): boolean {
  try {
    return localStorage.getItem(CLAVE_ONBOARDING_VISTO) === 'true'
  } catch {
    return false
  }
}

export function OnboardingCarousel({ onExplorar, onRegistrar }: Props) {
  const [paso, setPaso] = useState(0)

  function terminar(callback: () => void) {
    marcarOnboardingVisto()
    callback()
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--naranja)',
        color: '#ffffff',
        padding: '28px 26px 24px',
        overflowY: 'auto',
        minHeight: '100vh',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => terminar(onExplorar)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-sans)', fontSize: 14, cursor: 'pointer', padding: 6 }}
        >
          Saltar
        </button>
      </div>

      {paso === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 18 }}>
          <img src="/assets/logo-explorando-letras-full.png" alt="Explorando Letras" style={{ width: 240, maxWidth: '100%', height: 'auto' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 0', lineHeight: 1.3 }}>Bienvenido</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 300 }}>
            Estamos armando un archivo colectivo de las letras hechas a mano que hay en la ciudad, antes de
            que se pierdan. ¿Nos ayudás a guardarlas?
          </p>
        </div>
      )}

      {paso === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 22 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.3, textAlign: 'left', width: '100%', maxWidth: 300 }}>
            ¿Qué es este proyecto?
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 300, textAlign: 'left' }}>
            Carteles antiguos, nombres de negocios pintados a mano, avisos escritos en la pared. Con el
            tiempo se van perdiendo — las estamos fotografiando y guardando en un mapa colectivo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 6, textAlign: 'left', width: '100%', maxWidth: 300 }}>
            <PasoExplicativo
              texto="Fotografiás la letra o el cartel que encontraste"
              icono={
                <>
                  <rect x="3" y="7" width="18" height="13" rx="2" stroke="#fff" strokeWidth="1.6" />
                  <circle cx="12" cy="13.5" r="3.6" stroke="#fff" strokeWidth="1.6" />
                  <rect x="8.5" y="4" width="7" height="3" rx="1" stroke="#fff" strokeWidth="1.6" />
                </>
              }
            />
            <PasoExplicativo
              texto="Marcás exactamente dónde está"
              icono={
                <>
                  <circle cx="12" cy="10" r="3.4" stroke="#fff" strokeWidth="1.6" />
                  <path d="M12 21c4-5 7-8.5 7-12a7 7 0 10-14 0c0 3.5 3 7 7 12z" stroke="#fff" strokeWidth="1.6" />
                </>
              }
            />
            <PasoExplicativo
              texto="Queda guardada en el archivo, para siempre"
              icono={
                <>
                  <rect x="4" y="4" width="16" height="16" rx="2" stroke="#fff" strokeWidth="1.6" />
                  <line x1="8" y1="10" x2="16" y2="10" stroke="#fff" strokeWidth="1.6" />
                  <line x1="8" y1="14" x2="13" y2="14" stroke="#fff" strokeWidth="1.6" />
                </>
              }
            />
          </div>
        </div>
      )}

      {paso === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>¿Querés ser parte?</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 4px' }}>
            Podés mirar el archivo libremente, o crear una cuenta gratis para empezar a sumar tus propias
            fotos.
          </p>
          <button
            type="button"
            onClick={() => terminar(onExplorar)}
            style={{ textAlign: 'left', background: 'var(--ink-soft)', border: '1px solid var(--ink-line)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', color: '#fff' }}
          >
            <span style={{ display: 'block', fontWeight: 700, fontSize: 16, marginBottom: 3 }}>Solo quiero explorar</span>
            <span style={{ display: 'block', fontSize: 13, color: '#fff' }}>Ver el mapa y la galería, sin necesidad de cuenta</span>
          </button>
          <button
            type="button"
            onClick={() => terminar(onRegistrar)}
            style={{ textAlign: 'left', background: 'var(--magenta)', border: 'none', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', color: '#fff' }}
          >
            <span style={{ display: 'block', fontWeight: 700, fontSize: 16, marginBottom: 3 }}>Quiero sumar fotos</span>
            <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Creá tu cuenta gratis y empezá a registrar</span>
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '22px 0 4px' }}>
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPaso(i)}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: paso === i ? '#ffffff' : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
      </div>

      {paso < 2 && (
        <button
          type="button"
          onClick={() => setPaso((p) => Math.min(2, p + 1))}
          style={{ width: '100%', border: 'none', borderRadius: 10, padding: 15, fontSize: 16, fontWeight: 700, background: 'var(--magenta)', color: '#fff', cursor: 'pointer' }}
        >
          Siguiente
        </button>
      )}
    </div>
  )
}

function PasoExplicativo({ texto, icono }: { texto: string; icono: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
        {icono}
      </svg>
      <p style={{ margin: 0, fontSize: 15, color: '#fff', lineHeight: 1.5 }}>{texto}</p>
    </div>
  )
}
