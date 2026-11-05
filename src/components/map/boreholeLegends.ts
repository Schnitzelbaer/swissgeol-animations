import { ACCESS, BOREHOLE_TYPES, PURPOSES, WORKFLOW_STATES, type Borehole, type TemplateType } from '../../data/boreholes'

/** Legenden der Boreholes-Karte in der Reihenfolge der Figma-Section 8269:20012; der Wechsel-Button schaltet durch */
export const LEGEND_TOPICS = ['templateType', 'purpose', 'access', 'boreholeType', 'workflow'] as const
export type LegendTopic = (typeof LEGEND_TOPICS)[number]

const TEMPLATE_TYPES: TemplateType[] = ['general', 'geothermal', 'geotechnics', 'hydrogeology']

/** Werte pro Legende in Figma-Reihenfolge */
export const LEGEND_VALUES: Record<LegendTopic, readonly string[]> = {
  templateType: TEMPLATE_TYPES,
  purpose: PURPOSES,
  access: ACCESS,
  boreholeType: BOREHOLE_TYPES,
  workflow: WORKFLOW_STATES,
}

/** Erster Eintrag jeder Gruppe; davor steht in der Legende eine Trennlinie (nur Bohrzweck) */
export const GROUP_STARTS: Partial<Record<LegendTopic, readonly string[]>> = {
  purpose: ['Naturgefahren', 'Geotechnik', 'Hydrogeologie', 'Geothermie Exploration', 'Mineralische Rohstoffe', 'Wissenschaftliche Exploration', 'Anderer'],
}

/** Mindestbreite der Legende aus Figma; längere Übersetzungen machen sie breiter */
export const LEGEND_WIDTH: Record<LegendTopic, number> = { templateType: 212, purpose: 293, access: 179, boreholeType: 187, workflow: 233 }

const TEMPLATE_SYMBOL: Record<TemplateType, string> = {
  general: 'Template Typ/Allgemein',
  geothermal: 'Template Typ/Erdsonde',
  geotechnics: 'Template Typ/Baugrund',
  hydrogeology: 'Template Typ/Hydro',
}

const FIGMA_TOPIC: Record<Exclude<LegendTopic, 'templateType'>, string> = {
  purpose: 'Bohrzweck',
  access: 'Freigabe',
  boreholeType: 'Bohrtyp',
  workflow: 'Workflow Status',
}

export function legendValue(borehole: Borehole, topic: LegendTopic): string {
  return topic === 'templateType' ? borehole.type : borehole[topic]
}

/** Schlüssel in SYMBOLS (Figma-Variante «topic/type»); Trinkwasser ist in Figma ein eigenes Topic */
export function symbolKey(topic: LegendTopic, value: string) {
  if (topic === 'templateType') return TEMPLATE_SYMBOL[value as TemplateType]
  if (value === 'Trinkwasser') return 'Trinkwasser/Trinkwasser'
  return `${FIGMA_TOPIC[topic]}/${value}`
}
