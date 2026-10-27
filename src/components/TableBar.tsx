import { Button } from './Button'
import { useI18n } from '../i18n'
import styles from './TableBar.module.css'
import chevronUpIcon from '../assets/icons/chevron-up-table.svg'

/** Anzahl Assets wie im Figma-Screen */
const ASSET_COUNT = 23000

export function TableBar() {
  const { t } = useI18n()
  return (
    <div className={styles.bar}>
      <span className="body3">{t.table.count(ASSET_COUNT)}</span>
      <Button label={t.table.show} icon={chevronUpIcon} iconPosition="right" />
    </div>
  )
}
