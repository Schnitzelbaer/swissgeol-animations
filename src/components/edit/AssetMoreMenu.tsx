import { useEffect, useRef, useState } from 'react'
import { Button } from '../Button'
import { useI18n } from '../../i18n'
import styles from './AssetMoreMenu.module.css'
import moreIcon from '../../assets/icons/more.svg'
import trashRedIcon from '../../assets/icons/trash-red.svg'

/** Kontext-Button (Secondary, drei Punkte) links von «Duplicate»; darunter «Delete asset» als destruktiver Tertiary-Button */
export function AssetMoreMenu({ onDelete }: { onDelete?: () => void }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Schliessen: Klick daneben oder Escape
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className={styles.anchor}>
      <Button
        variant="secondary"
        icon={moreIcon}
        aria-label={t.edit.moreActions}
        aria-haspopup="menu"
        aria-expanded={open}
        className={open ? styles.active : undefined}
        onClick={() => setOpen(!open)}
      />
      {open && (
        <div className={styles.menu} role="menu">
          <Button
            role="menuitem"
            variant="tertiary-destructive"
            label={t.edit.deleteAsset}
            icon={trashRedIcon}
            iconPosition="right"
            className={styles.item}
            onClick={() => {
              setOpen(false)
              onDelete?.()
            }}
          />
        </div>
      )}
    </div>
  )
}
