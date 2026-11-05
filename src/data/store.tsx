import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { initialFiles, type AssetFile, type Section } from './files'
import type { LegendTopic } from '../components/map/boreholeLegends'

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
}

const StoreContext = createContext<Store | null>(null)

/** Hält die Dateien des Assets im Speicher; ein Neuladen der Seite stellt den Ausgangszustand wieder her */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState(initialFiles)
  const [analysing, setAnalysing] = useState<Set<string>>(new Set())
  const [boreholeLegend, setBoreholeLegend] = useState<LegendTopic>('templateType')
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
    () => ({ files, getFile, saveFiles, updateSections, analysing, startAnalysis, boreholeLegend, setBoreholeLegend }),
    [files, getFile, saveFiles, updateSections, analysing, startAnalysis, boreholeLegend],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore muss innerhalb von StoreProvider verwendet werden')
  return store
}
