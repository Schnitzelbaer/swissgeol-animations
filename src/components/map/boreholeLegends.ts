import type { Messages } from '../../i18n/messages'
import { ACCESS, BOREHOLE_TYPES, CONTENTS, LENGTH_CLASSES, PURPOSES, WORKFLOW_STATES, lengthClass, type Borehole, type TemplateType } from '../../data/boreholes'

/** Legenden der Boreholes-Karte in der Reihenfolge von Figma «Alle Legenden» (21008:128368); der Wechsel-Button schaltet durch */
export const LEGEND_TOPICS = ['templateType', 'purpose', 'boreholeType', 'access', 'workflow', 'length', 'contents'] as const
export type LegendTopic = (typeof LEGEND_TOPICS)[number]

const TEMPLATE_TYPES: TemplateType[] = ['general', 'geothermal', 'geotechnics', 'hydrogeology']

/** Werte pro Legende in Figma-Reihenfolge */
export const LEGEND_VALUES: Record<LegendTopic, readonly string[]> = {
  templateType: TEMPLATE_TYPES,
  purpose: PURPOSES,
  access: ACCESS,
  boreholeType: BOREHOLE_TYPES,
  workflow: WORKFLOW_STATES,
  length: LENGTH_CLASSES,
  contents: CONTENTS,
}

/** Erster Eintrag jeder Gruppe; davor steht in der Legende eine Trennlinie */
export const GROUP_STARTS: Partial<Record<LegendTopic, readonly string[]>> = {
  purpose: ['Naturgefahren', 'Geotechnik', 'Hydrogeologie', 'Geothermie Exploration', 'Mineralische Rohstoffe', 'Wissenschaftliche Exploration', 'Anderer'],
  boreholeType: ['Anderer'],
  length: ['Keine Angabe'],
  contents: ['Keine'],
}

/** Mindestbreite der Legende aus Figma; längere Übersetzungen machen sie breiter */
export const LEGEND_WIDTH: Record<LegendTopic, number> = { templateType: 212, purpose: 293, access: 179, boreholeType: 187, workflow: 233, length: 218, contents: 247 }

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
  length: 'Bohrlochlänge',
  contents: 'Verfügbare Inhalte',
}

export function legendValue(borehole: Borehole, topic: LegendTopic): string {
  if (topic === 'templateType') return borehole.type
  if (topic === 'length') return lengthClass(borehole.lengthM)
  return borehole[topic]
}

/** Schlüssel in SYMBOLS (Figma-Variante «topic/type»); Trinkwasser ist in Figma ein eigenes Topic */
export function symbolKey(topic: LegendTopic, value: string) {
  if (topic === 'templateType') return TEMPLATE_SYMBOL[value as TemplateType]
  if (value === 'Trinkwasser') return 'Trinkwasser/Trinkwasser'
  return `${FIGMA_TOPIC[topic]}/${value}`
}

/** Bezeichnung eines Legendenwerts in der aktuellen Sprache */
export function legendLabel(t: Messages, topic: LegendTopic, value: string) {
  return topic === 'templateType' ? t.boreholes.templateType[value as TemplateType] : (t.boreholes.values[value] ?? value)
}

/* Legende v2 (Varianten-Leiste): «Verfügbare Inhalte» zeigt einen Inhalt auf einmal als vorhanden / nicht vorhanden */

/** Inhalte, zwischen denen die Segmented Control in Legende v2 umschaltet */
export const CONTENT_KINDS = ['Profil', 'Dokumente', 'Fotos'] as const
export type ContentKind = (typeof CONTENT_KINDS)[number]

const PRESENT = 'vorhanden'
const MISSING = 'nicht vorhanden'

/** Was die Karte gerade zeigt: das Thema der Legende, in Legende v2 bei «Verfügbare Inhalte» zusätzlich den gewählten Inhalt */
export type LegendView = { topic: LegendTopic; content?: ContentKind }

export function hasContent(borehole: Borehole, kind: ContentKind) {
  return borehole.contents === 'Alle' || borehole.contents.split(' + ').includes(kind)
}

/** Eindeutiger Schlüssel einer Ansicht (Cache der Kartenstile) */
export function viewKey(view: LegendView) {
  return view.content ? `${view.topic}:${view.content}` : view.topic
}

/** Werte der Legende in ihrer Reihenfolge */
export function viewValues(view: LegendView): readonly string[] {
  return view.content ? [PRESENT, MISSING] : LEGEND_VALUES[view.topic]
}

export function viewValue(borehole: Borehole, view: LegendView) {
  if (view.content) return hasContent(borehole, view.content) ? PRESENT : MISSING
  return legendValue(borehole, view.topic)
}

/** Symbol eines Werts: vorhanden in der Farbe des Inhalts, nicht vorhanden grau */
export function viewSymbol(view: LegendView, value: string) {
  if (view.content) return value === PRESENT ? `Inhalt/${view.content}` : 'Inhalt/Nicht vorhanden'
  return symbolKey(view.topic, value)
}

export function viewLabel(t: Messages, view: LegendView, value: string) {
  if (view.content) return value === PRESENT ? t.boreholes.contentPresent[view.content] : t.boreholes.contentMissing[view.content]
  return legendLabel(t, view.topic, value)
}
