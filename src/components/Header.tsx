import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './Button'
import { LANGS, useI18n } from '../i18n'
import styles from './Header.module.css'
import logoSwissgeol from '../assets/logo-swissgeol.svg'
import logoAssets from '../assets/logo-assets.svg'
import chevronDownLogo from '../assets/icons/chevron-down-logo.svg'
import chevronDownLang from '../assets/icons/chevron-down-lang.svg'
import chevronUpLang from '../assets/icons/chevron-up-lang.svg'
import checkIcon from '../assets/icons/check.svg'
import searchIcon from '../assets/icons/search.svg'
import userIcon from '../assets/icons/user.svg'

/** Sprachwahl («form – building blocks / menu» unter dem gedrückten Sprach-Button, Figma 7537:89746) */
function LanguageMenu() {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Escape schliesst nur das Menü, nicht das Panel dahinter
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return
    event.preventDefault()
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`${styles.langRoot} ${open ? styles.langOpen : ''}`} onKeyDown={onKeyDown}>
      <Button
        label={lang.toUpperCase()}
        icon={open ? chevronUpLang : chevronDownLang}
        iconPosition="right"
        className={styles.lang}
        aria-label={`${t.header.language}: ${lang.toUpperCase()}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      />
      <ul className={styles.langMenu} role="listbox" aria-label={t.header.language}>
        {LANGS.map((code) => (
          <li key={code}>
            <button
              type="button"
              role="option"
              aria-selected={code === lang}
              className={`${styles.langOption} ${code === lang ? styles.langSelected : ''}`}
              tabIndex={open ? 0 : -1}
              onClick={() => {
                setLang(code)
                setOpen(false)
              }}
            >
              <img src={checkIcon} alt="" className={styles.langCheck} />
              <span className="body3 ellipsis">{code.toUpperCase()}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Header({ showSearch = true }: { showSearch?: boolean }) {
  const { t } = useI18n()
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Link to="/" className={styles.logo} aria-label="swissgeol assets">
          <img src={logoSwissgeol} alt="" />
          <img src={logoAssets} alt="" className={styles.logoAssets} />
        </Link>
        <Button icon={chevronDownLogo} aria-label={t.header.switchApp} />
      </div>

      {showSearch ? (
        <label className={styles.search}>
          <img src={searchIcon} alt="" />
          <input type="search" placeholder={t.header.search} className={styles.searchInput} />
        </label>
      ) : (
        <span />
      )}

      <div className={styles.actions}>
        <span className={styles.version}>2.0.687</span>
        <LanguageMenu />
        <Button variant="primary" round icon={userIcon} aria-label={t.header.account} />
      </div>
    </header>
  )
}
