import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { initialFiles, type AssetFile, type Section } from './files'
import { CONTENT_KINDS, LEGEND_TOPICS, type ContentKind, type LegendTopic } from '../components/map/boreholeLegends'

/** Dauer der simulierten AI-Analyse (in der echten Anwendung teils über 20 Minuten) */
export const ANALYSIS_DURATION_MS = 7000

type Store = {
  files: AssetFile[]
  getFile: (id: string | null | undefined) => AssetFile | undefined
  /** Ersetzt die Dateien eines Assets (Bearbeiten-Seite «Speichern») */
  saveFiles: (assetId: string, files: AssetFile[]) => void
  updateSections: (fileId: string, sections: Section[]) => void
  analysing: Set<string>
  startAnalysis: (fileIds: string[]) => void
  /** Legende der Boreholes-Karte; bleibt beim Wechsel zur Detailseite und zurück erhalten */
  boreholeLegend: LegendTopic
  setBoreholeLegend: (topic: LegendTopic) => void
  /** Legende v2, «Verfügbare Inhalte»: gewählter Inhalt der Segmented Control */
  boreholeContent: ContentKind
  setBoreholeContent: (kind: ContentKind) => void
}

const StoreContext = createContext<Store | null>(null)

const DEFAULT_LEGEND: LegendTopic = 'templateType'

function parseContent(value: string | null): ContentKind {
  return CONTENT_KINDS.find((kind) => kind.toLowerCase() === value) ?? CONTENT_KINDS[0]
}

function parseLegend(value: string | null): LegendTopic {
  return LEGEND_TOPICS.includes(value as LegendTopic) ? (value as LegendTopic) : DEFAULT_LEGEND
}

/** Hält die Dateien des Assets im Speicher; ein Neuladen der Seite stellt den Ausgangszustand wieder her */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState(initialFiles)
  const [analysing, setAnalysing] = useState<Set<string>>(new Set())
  // Legende der Boreholes-Karte: steht als ?legend=<Thema> in der URL (ausser der Standardlegende), damit jede teilbar ist
  const location = useLocation()
  const navigate = useNavigate()
  const [boreholeLegend, setBoreholeLegend] = useState<LegendTopic>(() => parseLegend(new URLSearchParams(location.search).get('legend')))
  // Legende v2: gewählter Inhalt als ?content=dokumente|fotos (Profil ist Standard)
  const [boreholeContent, setBoreholeContent] = useState<ContentKind>(() => parseContent(new URLSearchParams(location.search).get('content')))
  useEffect(() => {
    if (!location.pathname.startsWith('/boreholes')) return
    // window.location statt location: Sprache und Varianten werden im selben Durchgang nachgetragen
    const params = new URLSearchParams(window.location.search)
    const before = params.toString()
    const legend = boreholeLegend === DEFAULT_LEGEND ? null : boreholeLegend
    const content = boreholeContent === CONTENT_KINDS[0] ? null : boreholeContent.toLowerCase()
    if (legend) params.set('legend', legend)
    else params.delete('legend')
    if (content) params.set('content', content)
    else params.delete('content')
    const search = params.toString()
    if (search === before) return
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash }, { replace: true, state: location.state })
  }, [boreholeLegend, boreholeContent, location, navigate])
  const timers = useRef(new Map<string, number>())

  const getFile = useCallback((id: string | null | undefined) => files.find((file) => file.id === id), [files])

  const saveFiles = useCallback((assetId: string, assetFiles: AssetFile[]) => {
    setFiles((current) => [...current.filter((file) => file.assetId !== assetId), ...assetFiles])
  }, [])

  const updateSections = useCallback((fileId: string, sections: Section[]) => {
    setFiles((current) => current.map((file) => (file.id === fileId ? { ...file, sections } : file)))
  }, [])

  const startAnalysis = useCallback((fileIds: string[]) => {
    setAnalysing((current) => new Set([...current, ...fileIds]))
    for (const id of fileIds) {
      window.clearTimeout(timers.current.get(id))
      const timer = window.setTimeout(() => {
        setAnalysing((current) => {
          const next = new Set(current)
          next.delete(id)
          return next
        })
      }, ANALYSIS_DURATION_MS)
      timers.current.set(id, timer)
    }
  }, [])

  const value = useMemo(
    () => ({ files, getFile, saveFiles, updateSections, analysing, startAnalysis, boreholeLegend, setBoreholeLegend, boreholeContent, setBoreholeContent }),
    [files, getFile, saveFiles, updateSections, analysing, startAnalysis, boreholeLegend, boreholeContent],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore muss innerhalb von StoreProvider verwendet werden')
  return store
}
