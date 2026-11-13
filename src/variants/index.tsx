import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { VARIANT_GROUPS, defaultVariantOf } from './registry'

const PARAM_PREFIX = 'v-'
const BAR_STORAGE_KEY = 'swissgeol-variant-bar'

type Selection = Record<string, string>

type Variants = {
  /** Gewählte Variante je Gruppe (nur Abweichungen vom Standard) */
  selection: Selection
  select: (group: string, variant: string) => void
  barVisible: boolean
  setBarVisible: (visible: boolean) => void
  /** Ganz ausgeblendet (Cmd/Ctrl+Y), auch ohne Lasche, z.B. für Aufnahmen */
  barOff: boolean
}

const VariantsContext = createContext<Variants | null>(null)

function defaultOf(group: string) {
  const entry = VARIANT_GROUPS.find((candidate) => candidate.key === group)
  return entry ? defaultVariantOf(entry) : undefined
}

/** Gültige Abweichungen vom Standard aus der URL */
function parseSelection(search: string): Selection {
  const params = new URLSearchParams(search)
  const selection: Selection = {}
  for (const group of VARIANT_GROUPS) {
    const value = params.get(PARAM_PREFIX + group.key)
    if (value && value !== defaultVariantOf(group) && group.variants.some((variant) => variant.key === value)) selection[group.key] = value
  }
  return selection
}

type BarState = 'shown' | 'hidden' | 'off'

function readBarState(): BarState {
  try {
    const stored = localStorage.getItem(BAR_STORAGE_KEY)
    return stored === 'hidden' || stored === 'off' ? stored : 'shown'
  } catch {
    return 'shown'
  }
}

function storeBarState(state: BarState) {
  try {
    localStorage.setItem(BAR_STORAGE_KEY, state)
  } catch {
    // ohne Speicher gilt die Wahl nur bis zum Neuladen
  }
}

/**
 * Varianten des Prototyps. Die Auswahl steht als ?v-<Gruppe>=<Variante> in der URL und wird wie die Sprache bei
 * jeder Navigation nachgetragen; ob die Leiste eingeblendet ist, merkt sich der Browser.
 */
export function VariantsProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [selection, setSelection] = useState<Selection>(() => parseSelection(location.search))
  const [barState, setBarState] = useState(readBarState)

  useEffect(() => {
    // Eine Weiterleitung (z.B. / → /asset/4841) hat die Adresse schon geändert: warten, bis location nachzieht
    if (window.location.pathname !== location.pathname) return
    // window.location statt location: Sprache und Legende werden im selben Durchgang nachgetragen
    const params = new URLSearchParams(window.location.search)
    const before = params.toString()
    for (const key of [...params.keys()]) if (key.startsWith(PARAM_PREFIX)) params.delete(key)
    for (const group of VARIANT_GROUPS) if (selection[group.key]) params.set(PARAM_PREFIX + group.key, selection[group.key])
    const search = params.toString()
    if (search === before) return
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash }, { replace: true, state: location.state })
  }, [selection, location, navigate])

  const select = useCallback((group: string, variant: string) => {
    setSelection((current) => {
      const next = { ...current }
      if (variant === defaultOf(group)) delete next[group]
      else next[group] = variant
      return next
    })
  }, [])

  const setBarVisible = useCallback((visible: boolean) => {
    const next = visible ? 'shown' : 'hidden'
    setBarState(next)
    storeBarState(next)
  }, [])

  // Cmd+Y (Mac) bzw. Ctrl+Y blendet die Leiste samt Lasche ganz aus und wieder ein
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey || event.key.toLowerCase() !== 'y') return
      event.preventDefault()
      setBarState((current) => {
        const next = current === 'off' ? 'shown' : 'off'
        storeBarState(next)
        return next
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const barVisible = barState === 'shown'
  const barOff = barState === 'off'
  const value = useMemo(() => ({ selection, select, barVisible, setBarVisible, barOff }), [selection, select, barVisible, setBarVisible, barOff])
  return <VariantsContext.Provider value={value}>{children}</VariantsContext.Provider>
}

export function useVariants() {
  const context = useContext(VariantsContext)
  if (!context) throw new Error('useVariants braucht einen VariantsProvider')
  return context
}

/** Aktive Variante einer Gruppe (Schlüssel); ohne Auswahl der Standard der Gruppe */
export function useVariant(group: string) {
  const { selection } = useVariants()
  return selection[group] ?? defaultOf(group)
}
