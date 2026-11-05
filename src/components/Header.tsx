import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from './Button'
import { LANGS, useI18n } from '../i18n'
import styles from './Header.module.css'
import logoSwissgeol from '../assets/logo-swissgeol.svg'
import logoAssets from '../assets/logo-assets.svg'
import logoBoreholes from '../assets/logo-boreholes.svg'
import logoViewer from '../assets/logo-viewer.svg'
import logoLexic from '../assets/logo-lexic.png'
import chevronDownLogo from '../assets/icons/chevron-down-logo.svg'
import chevronUpLogo from '../assets/icons/chevron-up-logo.svg'
import chevronDownLang from '../assets/icons/chevron-down-lang.svg'
import chevronUpLang from '../assets/icons/chevron-up-lang.svg'
import checkIcon from '../assets/icons/check.svg'
import searchIcon from '../assets/icons/search.svg'
import userIcon from '../assets/icons/user.svg'

export type AppId = 'assets' | 'boreholes'

type SwitcherApp = AppId | 'viewer' | 'lexic'

/** Startseiten der nachgebauten Applikationen; viewer und lexic sind nur im Menü sichtbar */
const APP_HOME: Record<AppId, string> = { assets: '/', boreholes: '/boreholes' }

/** Logo einer Applikation in Figma-Höhe 36px (Header) bzw. 28px (Menü) */
function AppLogo({ app, height }: { app: SwitcherApp; height: 36 | 28 }) {
  const scale = height / 36
  if (app === 'assets') {
    // «swissgeol» und «assets» sind in Figma über ein Raster nebeneinander gesetzt
    return (
      <span className={styles.logoAssetsBox} style={{ width: 131.37 * scale, height }}>
        <span className={styles.logoAssetsInner} style={{ transform: `scale(${scale})` }}>
          <img src={logoSwissgeol} alt="" />
          <img src={logoAssets} alt="" className={styles.logoAssets} />
        </span>
      </span>
    )
  }
  if (app === 'boreholes') return <img src={logoBoreholes} alt="" style={{ height, width: 169 * scale }} />
  if (app === 'viewer') return <img src={logoViewer} alt="" style={{ height: 28, width: 108 }} />
  return <img src={logoLexic} alt="" style={{ height: 30, width: 93 }} />
}

/** Logo mit App-Wechsel per Dropdown (Figma «Applikation Selektion via Dropdown», 19565:117705) */
function AppSwitcher({ app }: { app: AppId }) {
  const { t } = useI18n()
  const navigate = useNavigate()
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

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return
    event.preventDefault()
    setOpen(false)
  }

  const apps: SwitcherApp[] = ['boreholes', 'assets', 'viewer', 'lexic']

  return (
    <div ref={rootRef} className={`${styles.brand} ${open ? styles.switcherOpen : ''}`} onKeyDown={onKeyDown}>
      <Link to={APP_HOME[app]} className={styles.logo} aria-label={t.apps[app]}>
        <AppLogo app={app} height={36} />
      </Link>
      <Button
        icon={open ? chevronUpLogo : chevronDownLogo}
        className={styles.switcherButton}
        aria-label={t.header.switchApp}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      />
      <ul className={styles.switcherMenu} role="listbox" aria-label={t.apps.menu}>
        {apps.map((entry) => {
          const available = entry === 'assets' || entry === 'boreholes'
          return (
            <li key={entry}>
              <button
                type="button"
                role="option"
                aria-selected={entry === app}
                aria-label={t.apps[entry]}
                aria-disabled={!available}
                className={`${styles.switcherOption} ${entry === app ? styles.switcherSelected : ''} ${available ? '' : styles.switcherDisabled}`}
                tabIndex={open && available ? 0 : -1}
                onClick={() => {
                  if (!available) return
                  setOpen(false)
                  if (entry !== app) navigate(APP_HOME[entry as AppId])
                }}
              >
                <img src={checkIcon} alt="" className={styles.switcherCheck} />
                <AppLogo app={entry} height={28} />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

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

export function Header({ app = 'assets', showSearch = app === 'assets' }: { app?: AppId; showSearch?: boolean }) {
  const { t } = useI18n()
  return (
    <header className={styles.header}>
      <AppSwitcher app={app} />

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
