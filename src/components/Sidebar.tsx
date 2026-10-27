import { useI18n } from '../i18n'
import styles from './Sidebar.module.css'
import filterIcon from '../assets/icons/filter.svg'
import starIcon from '../assets/icons/star.svg'
import plusIcon from '../assets/icons/plus.svg'
import geometryIcon from '../assets/icons/geometry-templates.svg'
import settingsIcon from '../assets/icons/settings.svg'
import bookIcon from '../assets/icons/book.svg'

const topItems = [
  { icon: filterIcon, key: 'filters' },
  { icon: starIcon, key: 'favourites' },
  { icon: plusIcon, key: 'newAsset' },
  { icon: geometryIcon, key: 'geometryTemplates' },
] as const

const bottomItems = [
  { icon: settingsIcon, key: 'settings' },
  { icon: bookIcon, key: 'wiki' },
] as const

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
  const { t } = useI18n()
  return (
    <nav className={styles.sidebar}>
      <div className={styles.group}>
        {topItems.map((item) => (
          <SidebarButton key={item.key} icon={item.icon} label={t.sidebar[item.key]} />
        ))}
      </div>
      <div className={styles.group}>
        {bottomItems.map((item) => (
          <SidebarButton key={item.key} icon={item.icon} label={t.sidebar[item.key]} />
        ))}
      </div>
    </nav>
  )
}
