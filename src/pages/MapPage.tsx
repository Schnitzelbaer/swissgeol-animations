import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useMatch, useNavigate, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { MapView } from '../components/map/MapView'
import { TableBar } from '../components/TableBar'
import { PreviewPanel } from '../components/preview/PreviewPanel'
import { useDocumentViewer } from '../components/viewer/useDocumentViewer'
import { asset } from '../data/asset'
import styles from './MapPage.module.css'

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

/**
 * Karte mit Preview-Panel. Routen: /map (nur Karte), /asset/:id (Panel offen).
 * Query-Parameter: toc=<Datei-IDs> öffnet Inhaltsverzeichnisse, doc/page öffnet den PDF-Viewer.
 */
export function MapPage() {
  const navigate = useNavigate()
  const assetMatch = useMatch('/asset/:assetId')
  const [searchParams, setSearchParams] = useSearchParams()
  const { openDocument, isOpen: viewerOpen } = useDocumentViewer()
  const panelOpen = Boolean(assetMatch)
  const wide = useMediaQuery(WIDE_QUERY)
  const panelOffset = panelOpen && wide ? PANEL_WIDTH : 0

  const openTocs = searchParams.get('toc')?.split(',').filter(Boolean) ?? []
  const toggleToc = (fileId: string) => {
    const next = openTocs.includes(fileId) ? openTocs.filter((id) => id !== fileId) : [...openTocs, fileId]
    setSearchParams(
      (params) => {
        if (next.length) params.set('toc', next.join(','))
        else params.delete('toc')
        return params
      },
      { replace: true },
    )
  }

  const openPanel = useCallback(() => navigate(`/asset/${asset.id}`), [navigate])
  const closePanel = useCallback(() => navigate('/map'), [navigate])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !viewerOpen) closePanel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closePanel, viewerOpen])

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
          <PreviewPanel
            open={panelOpen}
            onClose={closePanel}
            onOpenDocument={openDocument}
            openTocs={openTocs}
            onToggleToc={toggleToc}
            onEdit={() => navigate(`/asset/${asset.id}/edit/files`)}
          />
        </main>
      </div>
    </div>
  )
}
