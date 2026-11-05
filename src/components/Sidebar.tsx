import { useI18n } from '../i18n'
import styles from './Sidebar.module.css'
import filterIcon from '../assets/icons/filter.svg'
import starIcon from '../assets/icons/star.svg'
import plusIcon from '../assets/icons/plus.svg'
import geometryIcon from '../assets/icons/geometry-templates.svg'
import settingsIcon from '../assets/icons/settings.svg'
import bookIcon from '../assets/icons/book.svg'
import uploadIcon from '../assets/icons/upload-cloud.svg'
import layersIcon from '../assets/icons/layers.svg'
import type { AppId } from './Header'

function SidebarButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button type="button" className={styles.item} aria-label={label} title={label}>
      <span className={styles.itemInner}>
        <img src={icon} alt="" />
      </span>
    </button>
  )
}

/** Sidebar der jeweiligen Applikation («Sidebar Assets» bzw. «Sidebar – Boreholes») */
export function Sidebar({ app }: { app: AppId }) {
  const { t } = useI18n()
  const items =
    app === 'boreholes'
      ? {
          top: [
            { icon: filterIcon, label: t.boreholes.sidebar.filters },
            { icon: plusIcon, label: t.boreholes.sidebar.newBorehole },
            { icon: uploadIcon, label: t.boreholes.sidebar.import },
            { icon: layersIcon, label: t.boreholes.sidebar.layers },
          ],
          bottom: [
            { icon: settingsIcon, label: t.boreholes.sidebar.settings },
            { icon: bookIcon, label: t.boreholes.sidebar.help },
          ],
        }
      : {
          top: [
            { icon: filterIcon, label: t.sidebar.filters },
            { icon: starIcon, label: t.sidebar.favourites },
            { icon: plusIcon, label: t.sidebar.newAsset },
            { icon: geometryIcon, label: t.sidebar.geometryTemplates },
          ],
          bottom: [
            { icon: settingsIcon, label: t.sidebar.settings },
            { icon: bookIcon, label: t.sidebar.wiki },
          ],
        }
  return (
    <nav className={styles.sidebar}>
      <div className={styles.group}>
        {items.top.map((item) => (
          <SidebarButton key={item.label} {...item} />
        ))}
      </div>
      <div className={styles.group}>
        {items.bottom.map((item) => (
          <SidebarButton key={item.label} {...item} />
        ))}
      </div>
    </nav>
  )
}
