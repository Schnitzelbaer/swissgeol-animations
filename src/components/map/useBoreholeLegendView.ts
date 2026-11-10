import { useMemo } from 'react'
import { useStore } from '../../data/store'
import { useVariant } from '../../variants'
import { LEGEND_TOPICS, LEGEND_TOPICS_V1, type LegendView } from './boreholeLegends'

/**
 * Aktuelle Ansicht der Boreholes-Legende je nach Variante (Varianten-Leiste):
 * - «Legende v1»: Stand vor dem Feedback (alte Symbole, Template Typ, dunkler Tooltip, altes Popover)
 * - «Legende v2»: aktuelle Symbolisierung, «Verfügbare Inhalte» mit farbigen Sektoren
 * - «Legende v3.1» / «v3.2»: «Verfügbare Inhalte» zeigt nur den gewählten Inhalt als vorhanden / nicht vorhanden,
 *   gewählt mit Segmented Control (v3.1) bzw. Radio Buttons (v3.2)
 * - «Legende v4»: wie v3.1, dazu Glühbirne immer sichtbar und Pfeil in der Vorschau einer einzelnen Bohrung
 * Ohne gewählte Legende (oder wenn sie in der Variante fehlt) gilt die erste der Variante.
 */
export function useBoreholeLegendView(): LegendView {
  const { boreholeLegend, boreholeContent } = useStore()
  const variant = useVariant('legend')
  return useMemo(() => {
    const classic = variant === 'v1'
    const cycle = classic ? LEGEND_TOPICS_V1 : LEGEND_TOPICS
    const topic = boreholeLegend && cycle.includes(boreholeLegend) ? boreholeLegend : cycle[0]
    if (classic) return { topic, classic }
    const singleArrow = variant === 'v4' || undefined
    if (topic === 'contents' && (variant === 'v3-1' || variant === 'v3-2' || variant === 'v4')) return { topic, content: boreholeContent, singleArrow }
    return { topic, singleArrow }
  }, [boreholeLegend, boreholeContent, variant])
}
