import { Button } from '../Button'
import { Modal } from '../Modal'
import styles from './AnalysisDialog.module.css'
import analyseIcon from '../../assets/icons/analyse-white.svg'

type Props = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Bestätigung vor einer erneuten AI-Analyse (Figma «dialog» 20844:27435) */
export function AnalysisDialog({ open, onCancel, onConfirm }: Props) {
  return (
    <Modal open={open} onClose={onCancel} variant="dialog" label="Neu analysieren">
      <div className={styles.dialog}>
        <p className={styles.text}>
          Bei einer erneuten Analyse werden die Seitenklassen und/oder Sprachen neu definiert. Bereits vorgenommene Anpassungen werden dabei überschrieben. Die
          Analyse kann längere Zeit in Anspruch nehmen.
        </p>
        <div className={styles.actions}>
          <Button variant="secondary-solid" label="Abbrechen" onClick={onCancel} />
          <Button variant="primary" label="Neu analysieren" icon={analyseIcon} iconPosition="right" onClick={onConfirm} autoFocus />
        </div>
      </div>
    </Modal>
  )
}
