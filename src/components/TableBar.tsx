import { Button } from './Button'
import { useI18n } from '../i18n'
import styles from './TableBar.module.css'
import chevronUpIcon from '../assets/icons/chevron-up-table.svg'

/** Leiste unter der Karte («… Tabelle – Startseite»): Anzahl Treffer und «Tabelle anzeigen» */
export function TableBar({ count }: { count: string }) {
  const { t } = useI18n()
  return (
    <div className={styles.bar}>
      <span className="body3">{count}</span>
      <Button label={t.table.show} icon={chevronUpIcon} iconPosition="right" />
    </div>
  )
}
