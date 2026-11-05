import { useMemo } from 'react'
import type { TemplateType } from '../../data/boreholes'
import type { Messages } from '../../i18n/messages'
import { BoreholePopover, BoreholeTooltip } from './BoreholePopover'
import type { LegendTopic } from './boreholeLegends'
import type { StackedControls } from './MapView'

/** Bezeichnung eines Legendenwerts in der aktuellen Sprache */
export function legendLabel(t: Messages, topic: LegendTopic, value: string) {
  return topic === 'templateType' ? t.boreholes.templateType[value as TemplateType] : (t.boreholes.values[value] ?? value)
}

/** Tooltip und Popover für dicht liegende Bohrungen; ein Klick in der Liste öffnet die Detailseite */
export function useBoreholeStack(topic: LegendTopic, onOpen: (id: string) => void) {
  return useMemo(
    () => ({
      tooltip: (ids: string[]) => <BoreholeTooltip ids={ids} />,
      popover: (ids: string[], controls: StackedControls) => <BoreholePopover ids={ids} topic={topic} controls={controls} onOpen={onOpen} />,
    }),
    [topic, onOpen],
  )
}
