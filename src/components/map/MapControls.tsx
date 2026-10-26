import { Button } from '../Button'
import styles from './MapControls.module.css'
import zoomInIcon from '../../assets/icons/zoom-in.svg'
import circleIcon from '../../assets/icons/circle.svg'
import zoomOutIcon from '../../assets/icons/zoom-out.svg'
import basemapThumb from '../../assets/map/basemap-thumb.png'

export type Basemap = 'grau' | 'farbe'

// Kachel der farbigen Landeskarte rund um Sursee als Vorschaubild
const COLOR_THUMB = 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/13/4280/2875.jpeg'

type Props = {
  basemap: Basemap
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onToggleBasemap: () => void
}

export function MapControls({ basemap, onZoomIn, onZoomOut, onReset, onToggleBasemap }: Props) {
  return (
    <div className={styles.controls}>
      <div className={styles.card}>
        <Button icon={zoomInIcon} aria-label="Hineinzoomen" onClick={onZoomIn} />
        <Button icon={circleIcon} aria-label="Ansicht zurücksetzen" onClick={onReset} />
        <Button icon={zoomOutIcon} aria-label="Herauszoomen" onClick={onZoomOut} />
      </div>

      <button
        type="button"
        className={styles.basemap}
        onClick={onToggleBasemap}
        aria-label={basemap === 'grau' ? 'Farbige Landeskarte anzeigen' : 'Graue Landeskarte anzeigen'}
      >
        <span className={styles.thumb}>
          <img src={basemapThumb} alt="" className={styles.thumbGrey} />
          <img src={COLOR_THUMB} alt="" className={`${styles.thumbColor} ${basemap === 'farbe' ? styles.visible : ''}`} />
        </span>
      </button>
    </div>
  )
}
