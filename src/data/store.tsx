import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { initialFiles, type AssetFile, type Section } from './files'
import { analysePdf, type AnalysisResult } from './analysis'
import { ALL_LEGEND_TOPICS, CONTENT_KINDS, type ContentKind, type LegendTopic } from '../components/map/boreholeLegends'

/** Mindestdauer der Analyse, damit sie sichtbar bleibt (in der echten Anwendung teils über 20 Minuten) */
export const ANALYSIS_DURATION_MS = 7000

type Store = {
  files: AssetFile[]
  getFile: (id: string | null | undefined) => AssetFile | undefined
  /** Ersetzt die Dateien eines Assets (Bearbeiten-Seite «Speichern») */
  saveFiles: (assetId: string, files: AssetFile[]) => void
  updateSections: (fileId: string, sections: Section[]) => void
  analysing: Set<string>
  /** Analysiert PDFs (pdf.js im Browser, siehe analysis.ts); Ergebnis landet in den Dateien und in analysisResults */
  startAnalysis: (targets: AssetFile[]) => void
  /** Letztes Ergebnis je Datei, mit Laufnummer; die Bearbeiten-Seite übernimmt es in ihren Entwurf */
  analysisResults: Map<string, { run: number; result: AnalysisResult | null }>
  /** Legende der Boreholes-Karte; bleibt beim Wechsel zur Detailseite und zurück erhalten */
  /** Gewählte Legende; null = erste Legende der aktiven Variante (useBoreholeLegendView) */
  boreholeLegend: LegendTopic | null
  setBoreholeLegend: (topic: LegendTopic) => void
  /** Legende v2, «Verfügbare Inhalte»: gewählter Inhalt der Segmented Control */
  boreholeContent: ContentKind
  setBoreholeContent: (kind: ContentKind) => void
}

const StoreContext = createContext<Store | null>(null)

function parseContent(value: string | null): ContentKind {
  return CONTENT_KINDS.find((kind) => kind.toLowerCase() === value) ?? CONTENT_KINDS[0]
}

function parseLegend(value: string | null): LegendTopic | null {
  return ALL_LEGEND_TOPICS.includes(value as LegendTopic) ? (value as LegendTopic) : null
}

/** Hält die Dateien des Assets im Speicher; ein Neuladen der Seite stellt den Ausgangszustand wieder her */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState(initialFiles)
  const [analysing, setAnalysing] = useState<Set<string>>(new Set())
  // Legende der Boreholes-Karte: steht als ?legend=<Thema> in der URL (ausser der Standardlegende), damit jede teilbar ist
  const location = useLocation()
  const navigate = useNavigate()
  const [boreholeLegend, setBoreholeLegend] = useState<LegendTopic | null>(() => parseLegend(new URLSearchParams(location.search).get('legend')))
  // Legende v2: gewählter Inhalt als ?content=dokumente|fotos (Profil ist Standard)
  const [boreholeContent, setBoreholeContent] = useState<ContentKind>(() => parseContent(new URLSearchParams(location.search).get('content')))
  useEffect(() => {
    if (!location.pathname.startsWith('/boreholes')) return
    // Eine Weiterleitung (z.B. / → /asset/4841) hat die Adresse schon geändert: warten, bis location nachzieht
    if (window.location.pathname !== location.pathname) return
    // window.location statt location: Sprache und Varianten werden im selben Durchgang nachgetragen
    const params = new URLSearchParams(window.location.search)
    const before = params.toString()
    const legend = boreholeLegend
    const content = boreholeContent === CONTENT_KINDS[0] ? null : boreholeContent.toLowerCase()
    if (legend) params.set('legend', legend)
    else params.delete('legend')
    if (content) params.set('content', content)
    else params.delete('content')
    const search = params.toString()
    if (search === before) return
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash }, { replace: true, state: location.state })
  }, [boreholeLegend, boreholeContent, location, navigate])

  const getFile = useCallback((id: string | null | undefined) => files.find((file) => file.id === id), [files])

  const saveFiles = useCallback((assetId: string, assetFiles: AssetFile[]) => {
    setFiles((current) => [...current.filter((file) => file.assetId !== assetId), ...assetFiles])
  }, [])

  const updateSections = useCallback((fileId: string, sections: Section[]) => {
    setFiles((current) => current.map((file) => (file.id === fileId ? { ...file, sections } : file)))
  }, [])

  const [analysisResults, setAnalysisResults] = useState<Store['analysisResults']>(new Map())
  const runs = useRef(new Map<string, number>())

  const startAnalysis = useCallback((targets: AssetFile[]) => {
    const pdfs = targets.filter((file) => file.format === 'PDF' && file.url)
    setAnalysing((current) => new Set([...current, ...pdfs.map((file) => file.id)]))
    for (const file of pdfs) {
      const run = (runs.current.get(file.id) ?? 0) + 1
      runs.current.set(file.id, run)
      const finish = (result: AnalysisResult | null) => {
        // Ein neuerer Lauf für dieselbe Datei hat Vorrang
        if (runs.current.get(file.id) !== run) return
        const patch = result ? { sections: result.sections, pages: result.pages, languages: result.languages, analysed: true } : { analysed: false }
        setFiles((current) => current.map((candidate) => (candidate.id === file.id ? { ...candidate, ...patch } : candidate)))
        setAnalysisResults((current) => new Map(current).set(file.id, { run, result }))
        setAnalysing((current) => {
          const next = new Set(current)
          next.delete(file.id)
          return next
        })
      }
      analysePdf(file.url!, ANALYSIS_DURATION_MS).then(finish, () => finish(null))
    }
  }, [])

  const value = useMemo(
    () => ({ files, getFile, saveFiles, updateSections, analysing, startAnalysis, analysisResults, boreholeLegend, setBoreholeLegend, boreholeContent, setBoreholeContent }),
    [files, getFile, saveFiles, updateSections, analysing, startAnalysis, analysisResults, boreholeLegend, boreholeContent],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore muss innerhalb von StoreProvider verwendet werden')
  return store
}
