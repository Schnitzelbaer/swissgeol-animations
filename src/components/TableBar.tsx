import { Button } from './Button'
import styles from './TableBar.module.css'
import chevronUpIcon from '../assets/icons/chevron-up-table.svg'

export function TableBar() {
  return (
    <div className={styles.bar}>
      <span className="body3">23’000 Assets</span>
      <Button label="Tabelle anzeigen" icon={chevronUpIcon} iconPosition="right" />
    </div>
  )
}
