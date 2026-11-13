import { Button } from '../Button'
import { Modal } from '../Modal'
import { useI18n } from '../../i18n'
import styles from './AnalysisDialog.module.css'

type Props = {
  open: boolean
  /** Titel des Abschnitts, der gelöscht werden soll (bleibt beim Ausblenden stehen) */
  title: string
  onCancel: () => void
  onConfirm: () => void
}

/** Sicherheitsabfrage vor dem Löschen eines Abschnitts im Inhaltsverzeichnis (gleicher Aufbau wie die Analyse-Abfrage) */
export function DeleteSectionDialog({ open, title, onCancel, onConfirm }: Props) {
  const { t } = useI18n()
  return (
    <Modal open={open} onClose={onCancel} variant="dialog" label={t.classification.deleteTitle}>
      <div className={styles.dialog}>
        <p className={styles.text}>{t.classification.deleteText(title)}</p>
        <div className={styles.actions}>
          <Button variant="secondary-solid" label={t.classification.cancel} onClick={onCancel} />
          <Button variant="primary" label={t.classification.deleteConfirm} onClick={onConfirm} autoFocus />
        </div>
      </div>
    </Modal>
  )
}
