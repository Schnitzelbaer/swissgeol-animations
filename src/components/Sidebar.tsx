import styles from './Sidebar.module.css'
import filterIcon from '../assets/icons/filter.svg'
import starIcon from '../assets/icons/star.svg'
import plusIcon from '../assets/icons/plus.svg'
import geometryIcon from '../assets/icons/geometry-templates.svg'
import settingsIcon from '../assets/icons/settings.svg'
import bookIcon from '../assets/icons/book.svg'

const topItems = [
  { icon: filterIcon, label: 'Filter' },
  { icon: starIcon, label: 'Favoriten' },
  { icon: plusIcon, label: 'Neues Asset' },
  { icon: geometryIcon, label: 'Geometrie-Vorlagen' },
]

const bottomItems = [
  { icon: settingsIcon, label: 'Einstellungen' },
  { icon: bookIcon, label: 'Wiki' },
]

function SidebarButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button type="button" className={styles.item} aria-label={label} title={label}>
      <span className={styles.itemInner}>
        <img src={icon} alt="" />
      </span>
    </button>
  )
}

export function Sidebar() {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.group}>
        {topItems.map((item) => (
          <SidebarButton key={item.label} {...item} />
        ))}
      </div>
      <div className={styles.group}>
        {bottomItems.map((item) => (
          <SidebarButton key={item.label} {...item} />
        ))}
      </div>
    </nav>
  )
}
