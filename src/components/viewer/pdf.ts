import type { PDFDocumentProxy } from 'pdfjs-dist'

/** pdf.js wird erst beim ersten geöffneten PDF geladen, damit die Karte schneller startet */
let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null
function getPdfjs() {
  pdfjsPromise ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    return pdfjs
  })
  return pdfjsPromise
}

export type PageSize = { width: number; height: number }

export type LoadedPdf = {
  doc: PDFDocumentProxy
  /** Seitengrössen in PDF-Punkten (ohne Rotation) */
  sizes: PageSize[]
}

const cache = new Map<string, Promise<LoadedPdf>>()

/** Lädt ein PDF (per Range-Requests, Seiten werden erst bei Bedarf geholt) und merkt es sich */
export function loadPdf(url: string) {
  let entry = cache.get(url)
  if (!entry) {
    entry = (async () => {
      const pdfjs = await getPdfjs()
      const doc = await pdfjs.getDocument({ url, disableAutoFetch: true }).promise
      const sizes = await Promise.all(
        Array.from({ length: doc.numPages }, async (_, index) => {
          const page = await doc.getPage(index + 1)
          const viewport = page.getViewport({ scale: 1 })
          return { width: viewport.width, height: viewport.height }
        }),
      )
      return { doc, sizes }
    })()
    entry.catch(() => cache.delete(url))
    cache.set(url, entry)
  }
  return entry
}

const textCache = new Map<string, Promise<string[]>>()

/** Text aller Seiten (OCR-Ebene der Scans) für die Suche */
export function loadPageTexts(url: string) {
  let entry = textCache.get(url)
  if (!entry) {
    entry = loadPdf(url).then(({ doc }) =>
      Promise.all(
        Array.from({ length: doc.numPages }, async (_, index) => {
          const page = await doc.getPage(index + 1)
          const content = await page.getTextContent()
          return content.items.map((item) => ('str' in item ? item.str : '')).join(' ')
        }),
      ),
    )
    textCache.set(url, entry)
  }
  return entry
}
