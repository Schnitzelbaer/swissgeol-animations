import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import type { LoadedPdf } from './pdf'
import styles from './PdfPages.module.css'

/** Seitlicher Rand; auf schmalen Bildschirmen dürfen die Steuerelemente die Seite überlagern */
const padX = (width: number) => (width < 600 ? 16 : 80)
const PAD_Y = 32
const GAP = 24
const MAX_PIXEL_RATIO = 2
const SCROLLBAR = 16

export type ScrollRequest = { page: number; id: number; smooth?: boolean }

type PageBox = { width: number; height: number; baseWidth: number }

function PdfPage({ doc, index, box, rotation, active }: { doc: PDFDocumentProxy; index: number; box: PageBox; rotation: number; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (!active) return
    let task: RenderTask | null = null
    let cancelled = false
    // Kurz warten, damit beim Zoomen nicht jeder Zwischenschritt neu gerendert wird
    const timer = window.setTimeout(async () => {
      const page = await doc.getPage(index + 1)
      if (cancelled || !canvasRef.current) return
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
      const viewport = page.getViewport({ scale: (box.width / box.baseWidth) * ratio, rotation })
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)
      task = page.render({ canvas, viewport })
      try {
        await task.promise
      } catch {
        return
      }
      if (cancelled || !canvasRef.current) return
      // Erst nach fertigem Rendern austauschen, damit nichts flackert
      const target = canvasRef.current
      target.width = canvas.width
      target.height = canvas.height
      target.getContext('2d')?.drawImage(canvas, 0, 0)
      setRendered(true)
    }, 120)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      task?.cancel()
    }
  }, [doc, index, box.width, box.baseWidth, rotation, active])

  return (
    <div className={styles.page} style={{ width: box.width, height: box.height }} data-page={index + 1}>
      <canvas ref={canvasRef} className={`${styles.canvas} ${rendered ? styles.rendered : ''}`} />
      {!rendered && <span className={styles.loader} aria-hidden />}
    </div>
  )
}

type Props = {
  pdf: LoadedPdf
  zoom: number
  rotation: number
  scrollRequest: ScrollRequest
  onPageChange: (page: number) => void
  /** Pinch-Zoom auf dem Trackpad: relativer Faktor, der Viewer begrenzt den Zoom */
  onZoom: (factor: number) => void
}

/** Stelle, die beim Zoomen an derselben Position im sichtbaren Bereich bleibt (Standard: die Mitte); x relativ zur Seite */
type Anchor = { page: number; fraction: number; offsetY?: number; fractionX?: number; offsetX?: number }

/** Alle Seiten untereinander, wie in der Live-Version; Seiten werden erst nahe am sichtbaren Bereich gerendert */
export function PdfPages({ pdf, zoom, rotation, scrollRequest, onPageChange, onZoom }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [activePages, setActivePages] = useState<Set<number>>(new Set())
  const anchorRef = useRef<Anchor>({ page: scrollRequest.page, fraction: 0 })
  const currentPageRef = useRef(scrollRequest.page)
  const onPageChangeRef = useRef(onPageChange)
  useEffect(() => {
    onPageChangeRef.current = onPageChange
  }, [onPageChange])

  // Aussenmasse inkl. Scrollbalken, damit ein erscheinender Scrollbalken die Seiten nicht neu skaliert
  useLayoutEffect(() => {
    const element = scrollRef.current!
    const update = () => setViewport({ width: element.offsetWidth, height: element.offsetHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element, { box: 'border-box' })
    return () => observer.disconnect()
  }, [])

  // Jede Seite passt beim Zoom 1 ganz in den sichtbaren Bereich (Platz für den vertikalen Scrollbalken reserviert)
  const boxes = useMemo<PageBox[]>(() => {
    const availableWidth = Math.max(viewport.width - padX(viewport.width) * 2 - SCROLLBAR, 120)
    const availableHeight = Math.max(viewport.height - PAD_Y * 2, 120)
    return pdf.sizes.map((size) => {
      const turned = rotation % 180 !== 0
      const width = turned ? size.height : size.width
      const height = turned ? size.width : size.height
      const fit = Math.min(availableWidth / width, availableHeight / height)
      return { width: Math.round(width * fit * zoom), height: Math.round(height * fit * zoom), baseWidth: width }
    })
  }, [pdf.sizes, viewport, zoom, rotation])

  const pageTop = (page: number) => {
    const element = scrollRef.current?.querySelector<HTMLElement>(`[data-page="${page}"]`)
    return element ? element.offsetTop : 0
  }

  const pageLeft = (page: number) => {
    const element = scrollRef.current?.querySelector<HTMLElement>(`[data-page="${page}"]`)
    return element ? element.offsetLeft : 0
  }

  // Aktuelle Seite = Seite auf Höhe des oberen Drittels; der Zoom-Anker bleibt die Mitte
  const handleScroll = () => {
    const element = scrollRef.current
    if (!element) return
    const reference = element.scrollTop + element.clientHeight * 0.3
    let current = 1
    for (let index = 0; index < boxes.length; index++) {
      if (pageTop(index + 1) - GAP / 2 <= reference) current = index + 1
    }
    const center = element.scrollTop + element.clientHeight / 2
    let anchorPage = 1
    for (let index = 0; index < boxes.length; index++) {
      if (pageTop(index + 1) - GAP / 2 <= center) anchorPage = index + 1
    }
    anchorRef.current = { page: anchorPage, fraction: (center - pageTop(anchorPage)) / Math.max(boxes[anchorPage - 1]?.height ?? 1, 1) }
    if (current !== currentPageRef.current) {
      currentPageRef.current = current
      onPageChangeRef.current(current)
    }
  }

  // Pinch-Zoom: Chrome, Firefox und Edge melden die Trackpad-Geste als wheel mit ctrlKey, Safari als gesture-Events.
  // Die Stelle unter den Fingern bleibt stehen; preventDefault verhindert, dass der Browser die ganze Seite zoomt.
  const boxesRef = useRef(boxes)
  boxesRef.current = boxes
  const onZoomRef = useRef(onZoom)
  onZoomRef.current = onZoom
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const zoomAt = (clientX: number, clientY: number, factor: number) => {
      const rect = element.getBoundingClientRect()
      const offsetX = clientX - rect.left
      const offsetY = clientY - rect.top
      const y = element.scrollTop + offsetY
      let page = 1
      for (let index = 0; index < boxesRef.current.length; index++) {
        if (pageTop(index + 1) - GAP / 2 <= y) page = index + 1
      }
      anchorRef.current = {
        page,
        fraction: (y - pageTop(page)) / Math.max(boxesRef.current[page - 1]?.height ?? 1, 1),
        offsetY,
        fractionX: (element.scrollLeft + offsetX - pageLeft(page)) / Math.max(boxesRef.current[page - 1]?.width ?? 1, 1),
        offsetX,
      }
      onZoomRef.current(factor)
    }
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return
      event.preventDefault()
      const delta = Math.min(Math.max(event.deltaY, -50), 50)
      zoomAt(event.clientX, event.clientY, Math.exp(-delta * 0.01))
    }
    type GestureEvent = UIEvent & { scale: number; clientX: number; clientY: number }
    let lastScale = 1
    const onGestureStart = (event: Event) => {
      event.preventDefault()
      lastScale = 1
    }
    const onGestureChange = (event: Event) => {
      event.preventDefault()
      const gesture = event as GestureEvent
      zoomAt(gesture.clientX, gesture.clientY, gesture.scale / lastScale)
      lastScale = gesture.scale
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    element.addEventListener('gesturestart', onGestureStart)
    element.addEventListener('gesturechange', onGestureChange)
    return () => {
      element.removeEventListener('wheel', onWheel)
      element.removeEventListener('gesturestart', onGestureStart)
      element.removeEventListener('gesturechange', onGestureChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Nur Seiten nahe am sichtbaren Bereich rendern
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      (entries) => {
        setActivePages((current) => {
          const next = new Set(current)
          for (const entry of entries) {
            const page = Number((entry.target as HTMLElement).dataset.page)
            if (entry.isIntersecting) next.add(page)
            else next.delete(page)
          }
          return next
        })
      },
      { root, rootMargin: '100% 0px' },
    )
    root.querySelectorAll('[data-page]').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [pdf, boxes.length])

  // Beim Zoomen, Drehen und bei Grössenänderungen (z.B. Inhaltsverzeichnis ein/aus) bleibt die Stelle in der Mitte erhalten
  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element || !viewport.height) return
    const { page, fraction, offsetY = element.clientHeight / 2, fractionX, offsetX = 0 } = anchorRef.current
    element.scrollTop = pageTop(page) + fraction * (boxes[page - 1]?.height ?? 0) - offsetY
    element.scrollLeft =
      fractionX === undefined ? (element.scrollWidth - element.clientWidth) / 2 : pageLeft(page) + fractionX * (boxes[page - 1]?.width ?? 0) - offsetX
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes])

  // Sprung zu einer Seite (Inhaltsverzeichnis, Blättern, URL)
  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element || !viewport.height) return
    const page = Math.min(Math.max(scrollRequest.page, 1), boxes.length)
    currentPageRef.current = page
    anchorRef.current = { page, fraction: 0.5 }
    element.scrollTo({ top: pageTop(page) - PAD_Y, behavior: scrollRequest.smooth ? 'smooth' : 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRequest.id, viewport.height > 0])

  return (
    <div ref={scrollRef} className={styles.scroll} onScroll={handleScroll}>
      <div className={styles.pages} style={{ padding: `${PAD_Y}px ${padX(viewport.width)}px`, gap: GAP }}>
        {boxes.map((box, index) => (
          <PdfPage key={index} doc={pdf.doc} index={index} box={box} rotation={rotation} active={activePages.has(index + 1)} />
        ))}
      </div>
    </div>
  )
}
