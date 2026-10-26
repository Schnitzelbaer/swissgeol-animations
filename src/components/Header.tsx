import { Link } from 'react-router-dom'
import { Button } from './Button'
import styles from './Header.module.css'
import logoSwissgeol from '../assets/logo-swissgeol.svg'
import logoAssets from '../assets/logo-assets.svg'
import chevronDownLogo from '../assets/icons/chevron-down-logo.svg'
import chevronDownLang from '../assets/icons/chevron-down-lang.svg'
import searchIcon from '../assets/icons/search.svg'
import userIcon from '../assets/icons/user.svg'

export function Header({ showSearch = true }: { showSearch?: boolean }) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Link to="/" className={styles.logo} aria-label="swissgeol assets">
          <img src={logoSwissgeol} alt="" />
          <img src={logoAssets} alt="" className={styles.logoAssets} />
        </Link>
        <Button icon={chevronDownLogo} aria-label="Applikation wechseln" />
      </div>

      {showSearch ? (
        <label className={styles.search}>
          <img src={searchIcon} alt="" />
          <input type="search" placeholder="Suche nach ..." className={styles.searchInput} />
        </label>
      ) : (
        <span />
      )}

      <div className={styles.actions}>
        <span className={styles.version}>2.0.687</span>
        <Button label="DE" icon={chevronDownLang} iconPosition="right" className={styles.lang} />
        <Button variant="primary" round icon={userIcon} aria-label="Benutzerkonto" />
      </div>
    </header>
  )
}
