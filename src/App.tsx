import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { MapView } from './components/map/MapView'
import { TableBar } from './components/TableBar'
import { PreviewPanel } from './components/preview/PreviewPanel'
import styles from './App.module.css'

const PANEL_WIDTH = 540

/** Ab dieser Breite liegt das Panel neben der Karte (Figma-Layout), darunter überdeckt es sie */
const WIDE_QUERY = '(min-width: 1101px)'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export default function App() {
  const [panelOpen, setPanelOpen] = useState(true)
  const wide = useMediaQuery(WIDE_QUERY)
  const panelOffset = panelOpen && wide ? PANEL_WIDTH : 0

  const openPanel = useCallback(() => setPanelOpen(true), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const mainStyle = {
    '--panel-width': `${PANEL_WIDTH}px`,
    '--panel-offset': `${panelOffset}px`,
  } as CSSProperties

  return (
    <div className={styles.app}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main} style={mainStyle}>
          <MapView panelOffset={panelOffset} onAssetClick={openPanel} />
          <TableBar />
          <PreviewPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
        </main>
      </div>
    </div>
  )
}
