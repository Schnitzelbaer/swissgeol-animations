import { useMemo } from 'react'
import { BoreholePopover, BoreholePreview } from './BoreholePopover'
import type { LegendTopic } from './boreholeLegends'
import type { StackedControls } from './MapView'

/** Vorschau (Hover) und Popover (Klick) für Bohrungen; ein Klick in der Liste öffnet die Detailseite */
export function useBoreholeStack(topic: LegendTopic, onOpen: (id: string) => void) {
  return useMemo(
    () => ({
      preview: (ids: string[]) => <BoreholePreview ids={ids} topic={topic} />,
      popover: (ids: string[], controls: StackedControls) => <BoreholePopover ids={ids} topic={topic} controls={controls} onOpen={onOpen} />,
    }),
    [topic, onOpen],
  )
}
