import { Button } from '../Button'
import { Modal } from '../Modal'
import { useI18n } from '../../i18n'
import styles from './AnalysisDialog.module.css'
import analyseIcon from '../../assets/icons/analyse-white.svg'

type Props = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Bestätigung vor einer erneuten AI-Analyse (Figma «dialog» 20844:27435) */
export function AnalysisDialog({ open, onCancel, onConfirm }: Props) {
  const { t } = useI18n()
  return (
    <Modal open={open} onClose={onCancel} variant="dialog" label={t.analysis.title}>
      <div className={styles.dialog}>
        <p className={styles.text}>{t.analysis.text}</p>
        <div className={styles.actions}>
          <Button variant="secondary-solid" label={t.analysis.cancel} onClick={onCancel} />
          <Button variant="primary" label={t.analysis.confirm} icon={analyseIcon} iconPosition="right" onClick={onConfirm} autoFocus />
        </div>
      </div>
    </Modal>
  )
}
