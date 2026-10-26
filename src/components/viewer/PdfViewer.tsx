import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '../Button'
import { Chip } from '../Chip'
import { TruncatedText, useTooltip } from '../Tooltip'
import { CLASSES_WITHOUT_LANGUAGE, groupSections, pageRange, sectionTitle, type AssetFile, type Section } from '../../data/files'
import { loadPdf, type LoadedPdf } from './pdf'
import { PdfPages, type ScrollRequest } from './PdfPages'
import styles from './PdfViewer.module.css'
import zoomInIcon from '../../assets/icons/zoom-in.svg'
import circleIcon from '../../assets/icons/circle.svg'
import zoomOutIcon from '../../assets/icons/zoom-out.svg'
import rotateIcon from '../../assets/icons/rotate.svg'
import firstIcon from '../../assets/icons/page-first.svg'
import prevIcon from '../../assets/icons/page-prev.svg'
import nextIcon from '../../assets/icons/page-next.svg'
import lastIcon from '../../assets/icons/page-last.svg'
import sidebarIcon from '../../assets/icons/sidebar-toggle.svg'
import chevronIcon from '../../assets/icons/chevron-down-small.svg'

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4]

function isActive(section: Section, page: number) {
  return section.from <= page && page <= section.to
}

function TocEntry({ section, page, onSelect, topLevel }: { section: Section; page: number; onSelect: (page: number) => void; topLevel?: boolean }) {
  const active = isActive(section, page)
  const showLanguage = section.language && !CLASSES_WITHOUT_LANGUAGE.includes(section.type)
  return (
    <li>
      <button
        type="button"
        className={`${styles.row} ${topLevel ? styles.topLevel : styles.entry} ${active ? styles.active : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={() => onSelect(section.from)}
      >
        <TruncatedText text={topLevel ? section.type : sectionTitle(section)} lines={topLevel ? 1 : 3} className={styles.entryTitle} />
        <span className={styles.entryMeta}>
          {showLanguage && <Chip size="small">{section.language}</Chip>}
          <span className={styles.pages}>{pageRange(section)}</span>
        </span>
      </button>
    </li>
  )
}

function TableOfContents({ sections, page, onSelect }: { sections: Section[]; page: number; onSelect: (page: number) => void }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const groups = groupSections(sections)
  const toggle = (type: string) =>
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })

  return (
    <ul className={styles.tocList}>
      {groups.map((group) =>
        group.type === 'Titelblatt' ? (
          group.sections.map((section) => <TocEntry key={section.id} section={section} page={page} onSelect={onSelect} topLevel />)
        ) : (
          <li key={group.type} className={collapsed.has(group.type) ? styles.groupCollapsed : ''}>
            <button type="button" className={`${styles.row} ${styles.groupRow}`} aria-expanded={!collapsed.has(group.type)} onClick={() => toggle(group.type)}>
              <span className={styles.groupChevron}>
                <img src={chevronIcon} alt="" />
              </span>
              <span className="ellipsis">{group.label}</span>
            </button>
            <div className={styles.groupCollapse}>
              <ul className={styles.groupEntries}>
                {group.sections.map((section) => (
                  <TocEntry key={section.id} section={section} page={page} onSelect={onSelect} />
                ))}
              </ul>
            </div>
          </li>
        ),
      )}
    </ul>
  )
}

function Pagination({ page, total, onGo }: { page: number; total: number; onGo: (page: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const value = Number(draft)
    if (Number.isFinite(value)) onGo(Math.min(Math.max(Math.round(value), 1), total))
    setDraft(null)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commit()
    if (event.key === 'Escape') {
      event.preventDefault()
      setDraft(null)
    }
  }
  return (
    <div className={`${styles.card} ${styles.pagination}`}>
      <Button icon={firstIcon} aria-label="Erste Seite" disabled={page <= 1} onClick={() => onGo(1)} />
      <Button icon={prevIcon} aria-label="Vorherige Seite" disabled={page <= 1} onClick={() => onGo(page - 1)} />
      <input
        className={styles.pageInput}
        inputMode="numeric"
        aria-label="Seite"
        value={draft ?? String(page)}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, ''))}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />
      <span className={`${styles.total} button-text`}>/ {total}</span>
      <Button icon={nextIcon} aria-label="Nächste Seite" disabled={page >= total} onClick={() => onGo(page + 1)} />
      <Button icon={lastIcon} aria-label="Letzte Seite" disabled={page >= total} onClick={() => onGo(total)} />
    </div>
  )
}

type Props = {
  file: AssetFile
  /** Gewünschte Seite, z.B. aus der URL oder dem Inhaltsverzeichnis */
  page: number
  onPageChange: (page: number) => void
  /** Abschnitte für das Inhaltsverzeichnis; im Klassifizierungs-Editor der aktuelle Entwurf */
  sections?: Section[]
  initialTocOpen?: boolean
}

/** Datei-Viewer mit Inhaltsverzeichnis links und Steuerung über den Seiten (Figma «PDF-Sidepanel – Assets») */
export function PdfViewer({ file, page, onPageChange, sections = file.sections ?? [], initialTocOpen = true }: Props) {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null)
  const [error, setError] = useState(false)
  const [zoomIndex, setZoomIndex] = useState(ZOOM_STEPS.indexOf(1))
  const [rotation, setRotation] = useState(0)
  const [currentPage, setCurrentPage] = useState(page)
  const [scrollRequest, setScrollRequest] = useState<ScrollRequest>({ page, id: 0 })
  // Auf schmalen Bildschirmen startet das Inhaltsverzeichnis geschlossen und überlagert beim Öffnen die Seiten
  const [tocOpen, setTocOpen] = useState(() => initialTocOpen && sections.length > 0 && window.matchMedia('(min-width: 801px)').matches)
  const requestId = useRef(0)
  const toggleTooltip = useTooltip(tocOpen ? 'Inhaltsverzeichnis ausblenden' : 'Inhaltsverzeichnis anzeigen')

  useEffect(() => {
    if (!file.url) return
    let cancelled = false
    setPdf(null)
    setError(false)
    setZoomIndex(ZOOM_STEPS.indexOf(1))
    setRotation(0)
    loadPdf(file.url)
      .then((loaded) => !cancelled && setPdf(loaded))
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
  }, [file.url])

  // Seitenwechsel von aussen (URL, Inhaltsverzeichnis im Panel, Klassifizierung) → hinscrollen
  useEffect(() => {
    if (page === currentPage) return
    requestId.current += 1
    setCurrentPage(page)
    setScrollRequest({ page, id: requestId.current, smooth: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const goTo = (target: number) => {
    requestId.current += 1
    setCurrentPage(target)
    setScrollRequest({ page: target, id: requestId.current, smooth: true })
    onPageChange(target)
  }

  const handleScrollPage = (target: number) => {
    setCurrentPage(target)
    onPageChange(target)
  }

  const total = pdf?.sizes.length ?? file.pages ?? 1

  return (
    <div className={`${styles.viewer} ${tocOpen ? styles.tocOpen : ''}`}>
      {sections.length > 0 && (
        <aside className={styles.toc} aria-label="Inhaltsverzeichnis" inert={!tocOpen}>
          <div className={styles.tocInner}>
            <TableOfContents sections={sections} page={currentPage} onSelect={goTo} />
          </div>
        </aside>
      )}

      <div className={styles.area}>
        {pdf && (
          <PdfPages
            key={file.url}
            pdf={pdf}
            zoom={ZOOM_STEPS[zoomIndex]}
            rotation={rotation}
            scrollRequest={scrollRequest}
            onPageChange={handleScrollPage}
          />
        )}
        {!pdf && !error && <span className={styles.loading} aria-label="PDF wird geladen" />}
        {error && <p className={styles.error}>Das PDF konnte nicht geladen werden.</p>}

        {sections.length > 0 && (
          <button
            type="button"
            className={styles.tocToggle}
            aria-label={tocOpen ? 'Inhaltsverzeichnis ausblenden' : 'Inhaltsverzeichnis anzeigen'}
            aria-expanded={tocOpen}
            onClick={() => setTocOpen(!tocOpen)}
            {...toggleTooltip.handlers}
          >
            <img src={sidebarIcon} alt="" />
            {toggleTooltip.tooltip}
          </button>
        )}

        <div className={styles.topControls}>
          <div className={`${styles.card} ${styles.zoomCard}`}>
            <Button icon={zoomInIcon} aria-label="Hineinzoomen" disabled={zoomIndex >= ZOOM_STEPS.length - 1} onClick={() => setZoomIndex(zoomIndex + 1)} />
            <Button icon={circleIcon} aria-label="Ganze Seite" onClick={() => setZoomIndex(ZOOM_STEPS.indexOf(1))} />
            <Button icon={zoomOutIcon} aria-label="Herauszoomen" disabled={zoomIndex <= 0} onClick={() => setZoomIndex(zoomIndex - 1)} />
          </div>
          <div className={styles.card}>
            <Button icon={rotateIcon} aria-label="Seiten drehen" onClick={() => setRotation((rotation + 90) % 360)} />
          </div>
        </div>

        <Pagination page={currentPage} total={total} onGo={goTo} />
      </div>
    </div>
  )
}
