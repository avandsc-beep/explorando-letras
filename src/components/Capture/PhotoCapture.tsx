import { useEffect, useRef, useState } from 'react'
import Cropper from 'cropperjs'
// eslint-disable-next-line import/no-unresolved
import 'cropperjs/dist/cropper.min.css'

const RESOLUCION_MINIMA_PX = 480 // ancho o alto mínimo aceptado

interface Props {
  onFotoLista: (blob: Blob, previewUrl: string) => void
}

type Etapa = 'elegir' | 'recortar' | 'ajustar'

export function PhotoCapture({ onFotoLista }: Props) {
  const [etapa, setEtapa] = useState<Etapa>('elegir')
  const [imagenOriginalUrl, setImagenOriginalUrl] = useState<string | null>(null)
  const [avisoCalidad, setAvisoCalidad] = useState<string | null>(null)
  const [brillo, setBrillo] = useState(100)
  const [contraste, setContraste] = useState(100)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const cropperRef = useRef<Cropper | null>(null)
  const canvasPreviewRef = useRef<HTMLCanvasElement | null>(null)
  const [imagenRecortadaUrl, setImagenRecortadaUrl] = useState<string | null>(null)

  function onSeleccionArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      if (img.width < RESOLUCION_MINIMA_PX || img.height < RESOLUCION_MINIMA_PX) {
        setAvisoCalidad(
          `La foto es de baja resolución (${img.width}×${img.height}px). Se recomienda al menos ${RESOLUCION_MINIMA_PX}px. Podés continuar, pero puede no servir para el banco de fuentes.`
        )
      } else {
        setAvisoCalidad(null)
      }
      setImagenOriginalUrl(url)
      setEtapa('recortar')
    }
    img.src = url
  }

  // Inicializar Cropper cuando entramos a la etapa de recorte
  useEffect(() => {
    if (etapa !== 'recortar' || !imgRef.current) return
    const cropper = new Cropper(imgRef.current, {
      viewMode: 1,
      autoCropArea: 0.9,
      background: false,
      aspectRatio: 5 / 4, // horizontal fijo 5:4, para que todas las fotos queden uniformes en la diagramación
    })
    cropperRef.current = cropper
    return () => {
      cropper.destroy()
      cropperRef.current = null
    }
  }, [etapa, imagenOriginalUrl])

  function confirmarRecorte() {
    const cropper = cropperRef.current
    if (!cropper) return
    // Alta resolución para impresión: 3000x2400px a 300dpi = 25x20cm de tamaño final
    const canvas = cropper.getCroppedCanvas({ maxWidth: 3000, maxHeight: 2400 })
    setImagenRecortadaUrl(canvas.toDataURL('image/jpeg', 0.95))
    setEtapa('ajustar')
  }

  // Dibuja la imagen recortada con filtros de brillo/contraste en el canvas de previsualización
  useEffect(() => {
    if (etapa !== 'ajustar' || !imagenRecortadaUrl || !canvasPreviewRef.current) return
    const canvas = canvasPreviewRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.filter = `brightness(${brillo}%) contrast(${contraste}%)`
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = imagenRecortadaUrl
  }, [etapa, imagenRecortadaUrl, brillo, contraste])

  function confirmarFoto() {
    const canvas = canvasPreviewRef.current
    if (!canvas) return
    canvas.toBlob(
      (blob) => {
        if (blob) onFotoLista(blob, canvas.toDataURL('image/jpeg', 0.95))
      },
      'image/jpeg',
      0.95
    )
  }

  function reiniciar() {
    setEtapa('elegir')
    setImagenOriginalUrl(null)
    setImagenRecortadaUrl(null)
    setBrillo(100)
    setContraste(100)
    setAvisoCalidad(null)
  }

  if (etapa === 'elegir') {
    return (
      <div className="el-field">
        <label className="el-label">Foto de la pieza</label>
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: '1px dashed var(--ink-line)',
            borderRadius: 10,
            padding: '32px 16px',
            cursor: 'pointer',
            color: 'var(--paper-dim)',
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--magenta)' }}>Tomar o subir foto</span>
          <span style={{ fontSize: 14 }}>Tocá acá para abrir la cámara o elegir una imagen</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onSeleccionArchivo}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    )
  }

  if (etapa === 'recortar') {
    return (
      <div className="el-field">
        <label className="el-label">Encuadrá la pieza</label>
        <p className="el-hint" style={{ marginTop: -4, marginBottom: 8 }}>
          El recorte queda siempre en el mismo formato horizontal, para que todas las fotos se vean
          parejas en el archivo final. Movete y agrandá el recuadro hasta que la letra quede bien centrada.
        </p>
        {avisoCalidad && <div className="el-error">{avisoCalidad}</div>}
        <div style={{ maxHeight: 360, overflow: 'hidden', borderRadius: 8 }}>
          <img ref={imgRef} src={imagenOriginalUrl ?? ''} style={{ maxWidth: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" className="el-btn el-btn-ghost" onClick={reiniciar}>
            Repetir foto
          </button>
          <button type="button" className="el-btn el-btn-primary" onClick={confirmarRecorte}>
            Continuar
          </button>
        </div>
      </div>
    )
  }

  // etapa === 'ajustar'
  return (
    <div className="el-field">
      <label className="el-label">Ajustá brillo y contraste</label>
      <canvas
        ref={canvasPreviewRef}
        style={{ width: '100%', borderRadius: 8, border: '1px solid var(--ink-line)' }}
      />
      <div style={{ marginTop: 12 }}>
        <label className="el-hint">Brillo</label>
        <input
          type="range"
          min={50}
          max={150}
          value={brillo}
          onChange={(e) => setBrillo(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      <div>
        <label className="el-hint">Contraste</label>
        <input
          type="range"
          min={50}
          max={150}
          value={contraste}
          onChange={(e) => setContraste(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" className="el-btn el-btn-ghost" onClick={reiniciar}>
          Repetir foto
        </button>
        <button type="button" className="el-btn el-btn-primary" onClick={confirmarFoto}>
          Usar esta foto
        </button>
      </div>
    </div>
  )
}
