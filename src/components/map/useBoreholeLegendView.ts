import { useMemo } from 'react'
import { useStore } from '../../data/store'
import { useVariant } from '../../variants'
import type { LegendView } from './boreholeLegends'

/**
 * Aktuelle Ansicht der Boreholes-Legende: Thema aus dem Store; in Legende v2 (Varianten-Leiste) zeigt
 * «Verfügbare Inhalte» nur den in der Segmented Control gewählten Inhalt als vorhanden / nicht vorhanden.
 */
export function useBoreholeLegendView(): LegendView {
  const { boreholeLegend: topic, boreholeContent } = useStore()
  const variant = useVariant('legend')
  return useMemo(() => (topic === 'contents' && variant === 'v2' ? { topic, content: boreholeContent } : { topic }), [topic, boreholeContent, variant])
}
