import { useMemo } from 'react'
import { useStore } from '../../data/store'
import { useVariant } from '../../variants'
import type { LegendView } from './boreholeLegends'

/**
 * Aktuelle Ansicht der Boreholes-Legende: Thema aus dem Store. In Legende v2.1 und v2.2 (Varianten-Leiste) zeigt
 * «Verfügbare Inhalte» nur den gewählten Inhalt als vorhanden / nicht vorhanden; gewählt wird er in v2.1 mit der
 * Segmented Control, in v2.2 mit Radio Buttons vor den Paaren.
 */
export function useBoreholeLegendView(): LegendView {
  const { boreholeLegend: topic, boreholeContent } = useStore()
  const variant = useVariant('legend')
  return useMemo(() => (topic === 'contents' && (variant === 'v2' || variant === 'v2-2') ? { topic, content: boreholeContent } : { topic }), [topic, boreholeContent, variant])
}
