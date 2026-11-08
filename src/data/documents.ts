// Dokument-Vorlagen: die echten swisstopo-PDFs in public/pdfs mit Inhaltsverzeichnis (aus den PDFs abgeleitet).
// Mehrere Assets können dasselbe Dokument enthalten; jede Datei bekommt dann eine eigene ID (files.ts).

import type { AssetFile, PageClass, Language, Section } from './files'

type SectionInput = Omit<Section, 'id'>

export type DocumentTemplate = Omit<AssetFile, 'id' | 'assetId' | 'uploaded' | 'sections'> & { sections?: SectionInput[] }

const text = (label: string, from: number, to: number, language: Language = 'DE'): SectionInput => ({ label, type: 'Text', language, from, to })
const page = (label: string, type: PageClass, from: number, to: number, language?: Language): SectionInput => ({ label, type, from, to, ...(language ? { language } : {}) })

const rammdiagramme = Array.from({ length: 8 }, (_, index) => page(`Baugrundsondierung No. ${index + 1}`, 'Diagramm', index + 6, index + 6, 'DE'))

const sondages = [
  [201, 4, 5],
  [202, 6, 8],
  [203, 9, 11],
  [204, 12, 13],
  [205, 14, 16],
  [206, 17, 19],
  [207, 20, 22],
].map(([number, from, to]) => page(`Sondage N° ${number}`, 'Bohrprofil', from, to, 'FR'))

/** Sondierungen SB 1 – SB 6 im Dokument 14366 (Tecknau), Seiten laut PDF */
const tecknauSondierungen = [
  [1, 10, 10],
  [2, 11, 11],
  [3, 12, 12],
  [4, 13, 14],
  [5, 15, 16],
  [6, 17, 17],
].map(([number, from, to]) => page(`Sondierung SB ${number}`, 'Bohrprofil', from, to, 'DE'))

export const DOCUMENTS = {
  '4841': {
    name: '4841_N12_Baugrunduntersuchungen_Thoerishaus.pdf',
    format: 'PDF',
    size: '4.2 MB',
    url: '/pdfs/4841.pdf',
    pages: 3,
    languages: ['DE'],
    sections: [
      page('Belegblatt SGD 4841', 'Titelblatt', 1, 1),
      page('N12 Rammsondierungen 1, 2, 3, 4 und BS 11 – Situation', 'Karte', 2, 2),
      page('Rammsondierungen RS 1 – RS 4', 'Diagramm', 3, 3, 'DE'),
      page('Kornverteilung in Summationskurven BS 11', 'Diagramm', 3, 3, 'DE'),
    ],
  },
  '8768': {
    name: '8768_N3_Sondierungen_SBB-Unterfuehrung_Lachen.pdf',
    format: 'PDF',
    size: '7.5 MB',
    url: '/pdfs/8768.pdf',
    pages: 13,
    languages: ['DE'],
    sections: [
      page('Belegblatt SGD 8768', 'Titelblatt', 1, 1),
      text('Begleitbrief Dr. Heinrich Jäckli an Ingenieurbüro A. Marty, 1. April 1970', 2, 2),
      page('Situation 1:1000 – Piezometerrohre für die Beobachtung der Grundwasserabsenkung bei der SBB-Unterführung der N3 in Lachen', 'Karte', 3, 4),
      text('Piezometerrohre für die Beobachtung der Grundwasserabsenkung', 5, 5),
      ...rammdiagramme,
    ],
  },
  '16623': {
    name: '16623_T20_Sondages_Tunnel_Vue-des-Alpes.pdf',
    format: 'PDF',
    size: '15 MB',
    url: '/pdfs/16623.pdf',
    pages: 22,
    languages: ['FR'],
    sections: [page('Tunnel de la Vue des Alpes – Situation des sondages N° 201 à 207', 'Karte', 1, 3), ...sondages],
  },
  '16622': {
    name: '16622_T20_Sondages_Gare_des_Convers.pdf',
    format: 'PDF',
    size: '5.7 MB',
    url: '/pdfs/16622.pdf',
    pages: 7,
    languages: ['FR'],
    sections: [
      page('Page de garde AGS 16622', 'Titelblatt', 1, 1),
      page('Tunnel de la Vue des Alpes – Situation des sondages N° 109 et 110', 'Karte', 2, 2),
      page('Sondage N° 109', 'Bohrprofil', 3, 4, 'FR'),
      page('Sondage N° 110', 'Bohrprofil', 5, 7, 'FR'),
    ],
  },
  'a56-55-csv': {
    name: 'a56_55_LDoc.csv',
    format: 'DB',
    size: '112 kb',
  },
  '12304': {
    name: '12304_Einwilligung_Schinznach.pdf',
    format: 'PDF',
    size: '2.7 MB',
    url: '/pdfs/12304.pdf',
    pages: 3,
    languages: ['DE'],
    legal: true,
    sections: [page('Seichte Sondierbohrungen beim Schinznach Bad', 'Vertrag', 1, 3, 'DE')],
  },
  // SBB, Ausbau Bahnhof und Bahnanlage Tecknau: Belegblatt, Situationspläne, Sondierungen und Rammsondierungen
  '14366': {
    name: '14366_SBB_Sondierungen_Bahnanlage_Tecknau.pdf',
    format: 'PDF',
    size: '18.6 MB',
    url: '/pdfs/14366.pdf',
    pages: 31,
    languages: ['DE'],
    sections: [
      page('Belegblatt SGD 14366', 'Titelblatt', 1, 1),
      page('Situation Strecke Basel – Olten, km 26.160 – 26.750', 'Karte', 2, 4),
      page('Situation Bahnhof und Bahnanlage Tecknau, km 27.0 – 27.4', 'Karte', 5, 9),
      ...tecknauSondierungen,
      page('Rammsondierungen RS 1 – RS 7', 'Diagramm', 18, 25, 'DE'),
      page('Rammsondierungen RS 8 – RS 13', 'Diagramm', 26, 31, 'DE'),
    ],
  },
  // Berichte der Landesgeologie Nr. 12 (2020), Kapitel laut Inhaltsverzeichnis, Seiten im PDF (gedruckte Seite + 2)
  'BLGD-12': {
    name: 'BLGD-12_Ceneri-Basistunnel_Zusammenfassender_Schlussbericht.pdf',
    format: 'PDF',
    size: '35.1 MB',
    url: '/pdfs/BLGD-12.pdf',
    pages: 268,
    languages: ['DE', 'IT', 'FR', 'EN'],
    sections: [
      page('Ceneri-Basistunnel – Berichte der Landesgeologie Nr. 12', 'Titelblatt', 1, 4),
      text('Vorwort des Herausgebers', 5, 5),
      text('Préface de l’éditeur', 6, 6, 'FR'),
      text('Prefazione dell’editore', 7, 7, 'IT'),
      text('Preface from the editor', 8, 8, 'EN'),
      text('Vorwort AlpTransit Gotthard AG', 9, 9),
      text('Prefazione dell’AlpTransit Gotthard AG', 10, 10, 'IT'),
      text('Zusammenfassung', 11, 15),
      text('Riassunto', 16, 20, 'IT'),
      text('Inhalts-, Figuren- und Tabellenverzeichnis', 21, 36),
      text('1. Einführung', 37, 43),
      text('2. Übersicht über die Geologie im Projektbereich', 44, 54),
      text('3. Geologischer Befund', 55, 86),
      text('4. Gesteinsgefüge und systematische Durchtrennung', 87, 102),
      text('5. Hydrogeologie', 103, 116),
      text('6. Radioaktivität und Asbest', 117, 122),
      text('7. Wiederverwertung des Ausbruchmaterials', 123, 124),
      text('8. Felstemperaturen', 125, 125),
      text('9. Allgemeine geotechnische Verhältnisse bei den Vortrieben', 126, 161),
      text('10. Gefährdungsbilder, Ereignisse und spezielle geotechnische Probleme', 162, 183),
      text('11. Bauprozesse und Bautechnik beim Tunnelvortrieb', 184, 217),
      text('12. Naturgefahren und Aussenanlagen', 218, 225),
      text('Literaturverzeichnis', 226, 229),
      text('Anhang 13-a – 13-d: Legenden', 230, 232),
      page('Anhang 13-e – 13-l: Trennflächen, Störungszonen und Homogenbereiche', 'Diagramm', 233, 246, 'DE'),
      page('Anhang 13-m – 13-o: Hydrochemische Parameter der Wassereintritte', 'Diagramm', 247, 249, 'DE'),
      page('Anhang 13-p – 13-w: Felsmechanische Laborversuche', 'Diagramm', 250, 268, 'DE'),
    ],
  },
  // Geologische Berichte Nr. 22 (1998, Nachdruck 2002): Kapitel und Tafeln
  'GBD-22': {
    name: 'GBD-22_Loetschberg-Basistunnel_Geologische_Voruntersuchungen.pdf',
    format: 'PDF',
    size: '41.6 MB',
    url: '/pdfs/GBD-22.pdf',
    pages: 144,
    languages: ['DE', 'FR', 'IT'],
    sections: [
      page('Lötschberg-Basistunnel – Geologische Berichte Nr. 22', 'Titelblatt', 1, 3),
      text('Vorwort des Herausgebers', 4, 5),
      text('Zusammenfassung', 6, 6),
      text('Résumé et riassunto', 7, 7, 'FR'),
      text('Verzeichnisse und Glossar', 8, 17),
      text('1 Einleitung', 18, 22),
      text('2 Geologischer Überblick', 23, 30),
      text('3 Tröge im Kander- und Gasteretal', 31, 39),
      text('4 Flysch ungeklärter Stellung, inkl. Taveyannaz-Serie', 40, 46),
      text('5 Wildhorn-Decke s.l.', 47, 58),
      text('6 Doldenhorn-Decke', 59, 72),
      text('7 Autochthon Nord', 73, 79),
      text('8 Aar-Massiv', 80, 97),
      text('9 Jungfraukeil', 98, 103),
      text('10 Autochthon Gampel-Baltschieder', 104, 114),
      text('11 Spannungsmessungen, Bergschlag', 115, 119),
      text('12 Rezente Bewegungen', 120, 122),
      text('13 Bemerkungen zur Tunnelprognose', 123, 132),
      text('Liste der Referenzen', 133, 137),
      page('Tafel 1: Tiefbohrungen zwischen Frutigen und Kandersteg', 'Bohrprofil', 138, 138, 'DE'),
      page('Tafel 2: Tiefbohrungen zwischen Kandersteg und Goppenstein', 'Bohrprofil', 139, 139, 'DE'),
      page('Tafel 3: Tiefbohrungen südlich Goppenstein', 'Bohrprofil', 140, 140, 'DE'),
      page('Tafel 4: Geologisches Prognoseprofil Lötschberg-Basistunnel Nord', 'Geotechnisches Profil', 141, 141, 'DE'),
      page('Tafel 5: Geologisches Prognoseprofil Lötschberg-Basistunnel Süd', 'Geotechnisches Profil', 142, 142, 'DE'),
      text('Tafel 6: Legende zu Tafel 4 und 5', 143, 143),
    ],
  },
} satisfies Record<string, DocumentTemplate>

export type DocumentKey = keyof typeof DOCUMENTS

/** Datei eines Assets aus einer Vorlage; Abschnitts-IDs hängen an der Datei-ID */
export function fileFromDocument(key: DocumentKey, file: { id: string; assetId: string; uploaded: string; legal?: boolean }): AssetFile {
  const { sections, ...rest } = DOCUMENTS[key] as DocumentTemplate
  return {
    ...rest,
    ...file,
    ...(file.legal !== undefined ? { legal: file.legal } : {}),
    ...(sections ? { sections: sections.map((section, index) => ({ ...section, id: `${file.id}-${index + 1}` })) } : {}),
  }
}
