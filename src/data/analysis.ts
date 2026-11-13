// Analyse hochgeladener PDFs im Browser: pdf.js liest jede Seite (OCR-Textebene der Scans). Erkennt die Analyse ein
// bekanntes swisstopo-Dokument (SGD-Nr. auf der Titelseite, z.B. 14366 «Sondierungen Tecknau»), übernimmt sie dessen
// vorbereitetes Inhaltsverzeichnis. Sonst werden die Seiten per Stichworten klassifiziert und gleiche Seiten zu
// Abschnitten zusammengefasst. Die echte Anwendung nutzt dafür eine AI; das hier ist eine nachvollziehbare Annäherung.

import { loadPageTexts } from '../components/viewer/pdf'
import { DOCUMENTS, type DocumentTemplate } from './documents'
import type { Language, PageClass, Section } from './files'
import { CLASSES_WITHOUT_LANGUAGE } from './files'

export type AnalysisResult = {
  pages: number
  languages: Language[]
  sections: Section[]
}

/**
 * Bekanntes Dokument: Die Titelseite (Belegblatt) nennt die SGD-Nummer, im OCR-Text aber nicht direkt hinter «SGD-Nr.»
 * (Formularfelder). Gesucht wird darum unter allen Zahlen der Seite eine bekannte Nummer mit passender Seitenzahl.
 */
function knownDocument(firstPage: string, pageCount: number): DocumentTemplate | undefined {
  if (!/SGD/i.test(firstPage)) return undefined
  const documents = DOCUMENTS as Record<string, DocumentTemplate>
  for (const number of firstPage.match(/\b\d{4,6}\b/g) ?? []) {
    const document = documents[number]
    if (document?.pages === pageCount) return document
  }
  return undefined
}

const STOPWORDS: Record<Language, string[]> = {
  DE: ['der', 'die', 'das', 'und', 'mit', 'für', 'von', 'nicht', 'wird', 'auf'],
  FR: ['le', 'la', 'les', 'des', 'et', 'du', 'pour', 'une', 'est', 'sur'],
  IT: ['il', 'di', 'che', 'della', 'per', 'del', 'una', 'sono', 'nel', 'gli'],
  EN: ['the', 'and', 'of', 'to', 'is', 'for', 'with', 'on', 'that', 'this'],
  RM: ['il', 'la', 'da', 'ed', 'cun', 'per', 'ina', 'in', 'dals', 'las'],
}

/** Sprache einer Seite nach Funktionswörtern; ohne genügend Text keine Angabe */
function languageOf(text: string): Language | undefined {
  const words = text.toLowerCase().match(/[a-zàâäéèêëïîôöùûüç]+/g) ?? []
  if (words.length < 15) return undefined
  let best: Language | undefined
  let bestScore = 2
  for (const [language, stopwords] of Object.entries(STOPWORDS) as [Language, string[]][]) {
    if (language === 'RM') continue
    const score = words.filter((word) => stopwords.includes(word)).length
    if (score > bestScore) {
      best = language
      bestScore = score
    }
  }
  return best
}

/** Seitenklasse nach Stichworten (gross/klein egal, OCR-Fehler teilweise abgefangen) */
function classOf(text: string, index: number): PageClass {
  const upper = text.toUpperCase()
  if (index === 0 && /SGD|BELEGBLATT|PAGE DE GARDE|TITEL/.test(upper)) return 'Titelblatt'
  if (/RAMMSOND|SONDAGE AU P[EÉ]N[EÉ]TROM|PENETRO|DIAGRAMM|KORNVERTEIL|SUMMATIONSKURVE/.test(upper)) return 'Diagramm'
  if (/BOHRPROFIL|SONDIERUNG|SONDAGE|BOHRUNG|SONDAGGIO|SCHICHT/.test(upper)) return 'Bohrprofil'
  if (/PLAN MIT|PLAN NIT|SITUATION|M\s*1\s*:\s*\d|MASSSTAB|[EÉ]CHELLE|KARTE|CARTE/.test(upper)) return 'Karte'
  if (/VERTRAG|EINWILLIGUNG|VEREINBARUNG|CONTRAT/.test(upper)) return 'Vertrag'
  return 'Text'
}

let counter = 0
const sectionId = () => `analysis-${Date.now().toString(36)}-${(counter += 1)}`

/** Gleiche Klasse (und Sprache) auf aufeinanderfolgenden Seiten wird ein Abschnitt */
function groupPages(pages: { type: PageClass; language?: Language }[]): Section[] {
  const sections: Section[] = []
  pages.forEach((page, index) => {
    const language = CLASSES_WITHOUT_LANGUAGE.includes(page.type) ? undefined : page.language
    const last = sections[sections.length - 1]
    if (last && last.type === page.type && last.language === language && last.to === index) {
      last.to = index + 1
      return
    }
    sections.push({ id: sectionId(), label: '', type: page.type, ...(language ? { language } : {}), from: index + 1, to: index + 1 })
  })
  return sections
}

/** Analysiert ein PDF; dauert mindestens minDuration, damit der Ablauf sichtbar bleibt */
export async function analysePdf(url: string, minDuration: number): Promise<AnalysisResult> {
  const started = Date.now()
  const texts = await loadPageTexts(url)
  let result: AnalysisResult
  const known = knownDocument(texts[0] ?? '', texts.length)
  if (known) {
    result = {
      pages: texts.length,
      languages: known.languages ?? [],
      sections: (known.sections ?? []).map((section) => ({ ...section, id: sectionId() })),
    }
  } else {
    const pages = texts.map((text, index) => ({ type: classOf(text, index), language: languageOf(text) }))
    // Seiten ohne erkennbare Sprache übernehmen die häufigste Sprache des Dokuments (Scans mit wenig OCR-Text)
    const counts = new Map<Language, number>()
    for (const page of pages) if (page.language) counts.set(page.language, (counts.get(page.language) ?? 0) + 1)
    const main = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0]
    const filled = pages.map((page) => ({ ...page, language: page.language ?? main }))
    result = { pages: texts.length, languages: [...counts.keys()], sections: groupPages(filled) }
  }
  const remaining = minDuration - (Date.now() - started)
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining))
  return result
}
