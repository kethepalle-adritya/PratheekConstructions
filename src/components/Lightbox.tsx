import { useEffect, useRef, useState } from 'react'

type LightboxProps = { src: string; alt: string; onClose: () => void }

export function Lightbox({ src, alt, onClose }: LightboxProps) {
  const closeButton = useRef<HTMLButtonElement>(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="lightbox-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="lightbox-dialog" role="dialog" aria-modal="true" aria-label={`Image viewer: ${alt}`}>
        <div className="lightbox-toolbar">
          <span className="lightbox-title">{alt}</span>
          <div className="lightbox-controls">
            <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - 0.25))} disabled={zoom <= 1}>−</button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(3, value + 0.25))} disabled={zoom >= 3}>+</button>
            <button ref={closeButton} className="lightbox-close" type="button" aria-label="Close image viewer" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="lightbox-stage"><img src={src} alt={alt} style={{ transform: `scale(${zoom})` }} /></div>
      </div>
    </div>
  )
}
