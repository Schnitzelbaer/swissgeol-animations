import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useVariants } from '../variants'
import { VARIANT_GROUPS } from '../variants/registry'
import styles from './VariantBar.module.css'

/**
 * Varianten-Leiste über der App (bewusst schwarz, damit sie nicht zur App gehört). Ein Dropdown listet die Gruppen
 * der aktuellen Seite mit ihren Varianten; «Link kopieren» teilt die aktuelle Kombination. Ausgeblendet bleibt oben
 * in der Mitte eine kleine Lasche, die beim Hover wächst und per Klick die Leiste wieder einblendet.
 */
export function VariantBar() {
  const { t } = useI18n()
  const { selection, select, barVisible, setBarVisible } = useVariants()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const groups = VARIANT_GROUPS.filter((group) => group.pages.test(location.pathname))
  // Im Button: Varianten ohne Gruppe immer, die übrigen nur, wenn sie vom Standard abweichen
  const active = groups
    .filter((group) => group.flat || selection[group.key])
    .map((group) => {
      const label = group.variants.find((variant) => variant.key === (selection[group.key] ?? group.variants[0]?.key))?.label
      return group.flat ? label : `${group.label}: ${label}`
    })

  // Höhe der Leiste für Overlays (Modal), die sonst über ihr liegen würden
  useEffect(() => {
    document.documentElement.style.setProperty('--variant-bar-height', barVisible ? 'var(--variant-bar-size)' : '0px')
  }, [barVisible])

  // Menü schliessen: Klick daneben oder Escape
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt(t.variants.copyLink, window.location.href)
    }
  }

  return (
    <>
      <div className={`${styles.bar} ${barVisible ? '' : styles.hidden}`} aria-hidden={!barVisible} inert={!barVisible}>
        <div className={styles.inner}>
          <span className={styles.label}>{t.variants.prototype}</span>
          <div className={styles.menuAnchor} ref={menuRef}>
            <button type="button" className={styles.trigger} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
              <span className="ellipsis">{active.length ? active.join(' · ') : t.variants.title}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={open ? styles.flipped : ''}>
                <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {open && (
              <div className={styles.menu} role="menu">
                {groups.length === 0 && <div className={styles.empty}>{t.variants.none}</div>}
                {groups.map((group) => {
                  const current = selection[group.key] ?? group.variants[0]?.key
                  return (
                    <div key={group.key} role="group" aria-label={group.label} className={`${styles.group} ${group.flat ? styles.flat : ''}`}>
                      {!group.flat && <div className={styles.groupLabel}>{group.label}</div>}
                      {group.variants.map((variant) => (
                        <button
                          key={variant.key}
                          type="button"
                          role="menuitemradio"
                          aria-checked={variant.key === current}
                          className={styles.option}
                          onClick={() => {
                            select(group.key, variant.key)
                            setOpen(false)
                          }}
                        >
                          <svg className={styles.check} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M3 7.2 5.8 10 11 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className={styles.optionText}>
                            <span>{variant.label}</span>
                            {variant.description && <span className={styles.description}>{variant.description}</span>}
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className={styles.spacer} />
          <button type="button" className={styles.action} onClick={copyLink}>
            {copied ? t.variants.copied : t.variants.copyLink}
          </button>
          <button type="button" className={styles.action} onClick={() => setBarVisible(false)} aria-label={t.variants.hide} title={t.variants.hide}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3.5 8.75 7 5.25l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      {!barVisible && (
        <button type="button" className={styles.tab} onClick={() => setBarVisible(true)} aria-label={t.variants.show} title={t.variants.show}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </>
  )
}
