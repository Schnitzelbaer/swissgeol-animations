import { useEffect, useRef, useState } from 'react'
import { Button } from '../Button'
import { useI18n } from '../../i18n'
import styles from './MapControls.module.css'
import zoomInIcon from '../../assets/icons/zoom-in.svg'
import circleIcon from '../../assets/icons/circle.svg'
import zoomOutIcon from '../../assets/icons/zoom-out.svg'
import basemapThumb from '../../assets/map/basemap-thumb.png'

/** Hintergrundkarten; die farbige Landeskarte ist Standard */
export const BASEMAPS = ['farbe', 'grau', 'luftbild'] as const
export type Basemap = (typeof BASEMAPS)[number]

// Kacheln rund um Sursee als Vorschaubilder; die graue Karte als lokales Bild (Ausschnitt wie in Figma)
const tile = (layer: string) => `https://wmts.geo.admin.ch/1.0.0/${layer}/default/current/3857/13/4280/2875.jpeg`
const THUMBS: Record<Basemap, string> = {
  farbe: tile('ch.swisstopo.pixelkarte-farbe'),
  grau: basemapThumb,
  luftbild: tile('ch.swisstopo.swissimage'),
}

function Thumb({ basemap, className }: { basemap: Basemap; className: string }) {
  return (
    <span className={className}>
      <img src={THUMBS[basemap]} alt="" className={basemap === 'grau' ? styles.greyImage : styles.tileImage} />
    </span>
  )
}

type Props = {
  basemap: Basemap
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onSelectBasemap: (basemap: Basemap) => void
}

/**
 * Steuerung rechts auf der Karte: Zoom und zurück zur Startansicht oben, unten die Hintergrundkarte.
 * Das runde Vorschaubild zeigt den aktuellen Hintergrund; ein Klick öffnet daneben die Auswahl der drei Hintergründe.
 */
export function MapControls({ basemap, onZoomIn, onZoomOut, onReset, onSelectBasemap }: Props) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Auswahl schliessen: Klick daneben oder Escape
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={styles.controls}>
      <div className={styles.card}>
        <Button icon={zoomInIcon} aria-label={t.map.zoomIn} onClick={onZoomIn} />
        <Button icon={circleIcon} aria-label={t.map.reset} onClick={onReset} />
        <Button icon={zoomOutIcon} aria-label={t.map.zoomOut} onClick={onZoomOut} />
      </div>

      <div className={styles.picker} ref={pickerRef}>
        {open && (
          <div className={styles.options} role="radiogroup" aria-label={t.map.basemap}>
            {BASEMAPS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={option === basemap}
                className={styles.option}
                onClick={() => {
                  onSelectBasemap(option)
                  setOpen(false)
                }}
              >
                <Thumb basemap={option} className={styles.optionThumb} />
                <span className={styles.optionLabel}>{t.map.basemaps[option]}</span>
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className={styles.basemap}
          onClick={() => setOpen(!open)}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label={`${t.map.basemap}: ${t.map.basemaps[basemap]}`}
        >
          {/* key: beim Wechsel blendet das neue Vorschaubild ein */}
          <Thumb key={basemap} basemap={basemap} className={styles.thumb} />
        </button>
      </div>
    </div>
  )
}
