interface Props {
  pasoActual: number
  totalPasos: number
  etiqueta: string
}

export function IndicadorPasos({ pasoActual, totalPasos, etiqueta }: Props) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '2px solid var(--magenta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 18,
            color: 'var(--magenta)',
            flexShrink: 0,
          }}
        >
          {pasoActual}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Paso {pasoActual} de {totalPasos}
          </p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{etiqueta}</p>
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--ink-line)', marginTop: 14 }} />
    </div>
  )
}
