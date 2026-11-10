import { useMemo } from 'react'
import { BoreholePopover, BoreholePreview } from './BoreholePopover'
import type { LegendView } from './boreholeLegends'
import type { StackedControls } from './MapView'

/** Vorschau (Hover) und Popover (Klick) für Bohrungen; ein Klick in der Liste öffnet die Detailseite */
export function useBoreholeStack(view: LegendView, onOpen: (id: string) => void) {
  return useMemo(
    () => ({
      preview: (ids: string[]) => <BoreholePreview ids={ids} view={view} />,
      popover: (ids: string[], controls: StackedControls) => <BoreholePopover ids={ids} view={view} controls={controls} onOpen={onOpen} />,
      activeOnPin: view.v4 === true,
    }),
    [view, onOpen],
  )
}
