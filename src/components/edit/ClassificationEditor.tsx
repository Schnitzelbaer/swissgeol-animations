import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { Button } from '../Button'
import { Chip } from '../Chip'
import { SelectField, TextField } from '../FormField'
import { PdfViewer } from '../viewer/PdfViewer'
import { ViewerHeader } from '../viewer/ViewerHeader'
import { loadPdf } from '../viewer/pdf'
import { SaveBar } from './SaveBar'
import { DeleteSectionDialog } from './DeleteSectionDialog'
import { CLASSES_WITHOUT_LANGUAGE, LANGUAGES, PAGE_CLASSES, newSectionId, pageRange, sectionTitle, type AssetFile, type Section } from '../../data/files'
import { useI18n } from '../../i18n'
import styles from './ClassificationEditor.module.css'
import resetIcon from '../../assets/icons/reset.svg'
import trashIcon from '../../assets/icons/trash.svg'
import chevronUpIcon from '../../assets/icons/chevron-up.svg'
import plusIcon from '../../assets/icons/plus-small.svg'
import closeIcon from '../../assets/icons/close.svg'

const NO_LANGUAGE = '–'

type SectionCardProps = {
  section: Section
  expanded: boolean
  pageCount: number
  onToggle: () => void
  onChange: (section: Section) => void
  onDelete: () => void
  cardRef: (element: HTMLDivElement | null) => void
  dragging: boolean
  onDragStart: (event: PointerEvent<HTMLButtonElement>) => void
  onMove: (delta: -1 | 1) => void
}

/** Griff mit sechs Punkten zum Umsortieren */
function GripIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      {[6, 10, 14].map((y) => (
        <g key={y}>
          <circle cx="7.5" cy={y} r="1.25" />
          <circle cx="12.5" cy={y} r="1.25" />
        </g>
      ))}
    </svg>
  )
}

function SectionCard({ section, expanded, pageCount, onToggle, onChange, onDelete, cardRef, dragging, onDragStart, onMove }: SectionCardProps) {
  const { t } = useI18n()
  const pages = Array.from({ length: pageCount }, (_, index) => ({ value: index + 1, label: String(index + 1) }))
  const showLanguage = section.language && !CLASSES_WITHOUT_LANGUAGE.includes(section.type)

  return (
    <div ref={cardRef} className={`${styles.card} ${expanded ? styles.expanded : ''} ${dragging ? styles.dragging : ''}`}>
      <div className={styles.cardHeader}>
        <button
          type="button"
          className={styles.grip}
          aria-label={t.classification.dragSection}
          title={t.classification.dragSection}
          onPointerDown={onDragStart}
          onKeyDown={(event: KeyboardEvent) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
            event.preventDefault()
            onMove(event.key === 'ArrowUp' ? -1 : 1)
          }}
        >
          <GripIcon />
        </button>
        <button type="button" className={styles.cardToggle} aria-expanded={expanded} onClick={onToggle}>
          <span className={`${styles.cardTitle} body3-bold`}>{sectionTitle(section, t.pageClass)}</span>
          <span className={styles.cardChips}>
            <Chip tone="white">{t.pageClass[section.type]}</Chip>
            {showLanguage && <Chip tone="white">{section.language}</Chip>}
            <Chip tone="white">{t.classification.pages(pageRange(section))}</Chip>
          </span>
        </button>
        <div className={styles.cardActions}>
          <Button icon={trashIcon} aria-label={t.classification.deleteSection} tooltip={t.classification.deleteSection} onClick={onDelete} />
          <Button icon={chevronUpIcon} className={styles.chevron} aria-label={expanded ? t.classification.collapse : t.classification.expand} onClick={onToggle} />
        </div>
      </div>
      <div className={styles.cardCollapse}>
        <div className={styles.cardClip}>
          <div className={styles.cardBody}>
            <TextField
              label={t.classification.label}
              value={section.label}
              placeholder={t.pageClass[section.type]}
              onChange={(label) => onChange({ ...section, label })}
            />
            <div className={styles.fieldRow}>
              <SelectField
                label={t.classification.type}
                required
                className={styles.typeField}
                value={section.type}
                options={PAGE_CLASSES.map((type) => ({ value: type, label: t.pageClass[type] }))}
                onChange={(type) => onChange({ ...section, type })}
              />
              <SelectField
                label={t.classification.language}
                required
                className={styles.smallField}
                value={section.language ?? NO_LANGUAGE}
                options={[...LANGUAGES.map((language) => ({ value: language as string, label: language })), { value: NO_LANGUAGE, label: NO_LANGUAGE }]}
                onChange={(language) => onChange({ ...section, language: language === NO_LANGUAGE ? undefined : (language as Section['language']) })}
              />
              <SelectField
                label={t.classification.pageFrom}
                required
                className={styles.smallField}
                value={section.from}
                options={pages}
                onChange={(from) => onChange({ ...section, from, to: Math.max(from, section.to) })}
              />
              <SelectField
                label={t.classification.pageTo}
                required
                className={styles.smallField}
                value={section.to}
                options={pages.filter((page) => page.value >= section.from)}
                onChange={(to) => onChange({ ...section, to })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type Props = {
  file: AssetFile
  files: AssetFile[]
  onCancel: () => void
  onSave: (sections: Section[]) => void
  onSelectFile: (fileId: string) => void
}

/** Klassifizierungs-Editor: Abschnitte links, Datei-Viewer rechts (Figma «Modal» 20844:27516) */
export function ClassificationEditor({ file, files, onCancel, onSave, onSelectFile }: Props) {
  const { t } = useI18n()
  const [sections, setSections] = useState<Section[]>(file.sections ?? [])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(file.sections?.[0] ? [file.sections[0].id] : []))
  const [dirty, setDirty] = useState(false)
  const [page, setPage] = useState(file.sections?.[0]?.from ?? 1)
  const [pageCount, setPageCount] = useState(file.pages ?? 1)
  const cards = useRef(new Map<string, HTMLDivElement>())
  const positions = useRef<Map<string, number> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const scrollToId = useRef<string | null>(null)

  useEffect(() => {
    if (!file.url || file.pages) return
    loadPdf(file.url).then(({ sizes }) => setPageCount(sizes.length))
  }, [file.url, file.pages])

  // Ziehen zum Umsortieren: die gezogene Karte folgt dem Zeiger, die übrigen gleiten (FLIP) an ihre neue Stelle
  const [dragId, setDragId] = useState<string | null>(null)
  const drag = useRef<{ id: string; grabOffset: number; pointerY: number } | null>(null)

  // FLIP: Karten gleiten nach dem Umsortieren oder Löschen an ihre neue Position
  const rememberPositions = () => {
    positions.current = new Map([...cards.current].map(([id, element]) => [id, element.getBoundingClientRect().top]))
  }
  useLayoutEffect(() => {
    const before = positions.current
    positions.current = null
    placeDragged()
    if (before) {
      for (const [id, element] of cards.current) {
        if (id === drag.current?.id) continue
        const previous = before.get(id)
        if (previous === undefined) continue
        const delta = previous - element.getBoundingClientRect().top
        if (Math.abs(delta) < 1) continue
        element.animate([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
      }
    }
    if (scrollToId.current) {
      cards.current.get(scrollToId.current)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      scrollToId.current = null
    }
  }, [sections])

  const update = (next: Section[]) => {
    setSections(next)
    setDirty(true)
  }

  // Beim Aufklappen springt der Viewer zur ersten Seite des Abschnitts
  const toggle = (section: Section) => {
    const opening = !expanded.has(section.id)
    setExpanded((current) => {
      const next = new Set(current)
      if (opening) next.add(section.id)
      else next.delete(section.id)
      return next
    })
    if (opening) setPage(section.from)
  }

  const change = (changed: Section) => {
    const previous = sections.find((section) => section.id === changed.id)
    if (previous && previous.from !== changed.from) setPage(changed.from)
    update(sections.map((section) => (section.id === changed.id ? changed : section)))
  }

  const remove = (id: string) => {
    rememberPositions()
    update(sections.filter((section) => section.id !== id))
  }

  // Löschen erst nach der Sicherheitsabfrage; der Titel bleibt während der Ausblendung des Dialogs stehen
  const [pendingDelete, setPendingDelete] = useState<Section | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const askDelete = (section: Section) => {
    setPendingDelete(section)
    setDeleteOpen(true)
  }

  const add = () => {
    const last = sections.reduce((max, section) => Math.max(max, section.to), 0)
    const from = Math.min(last + 1, pageCount)
    const section: Section = { id: newSectionId(), label: '', type: 'Text', language: 'DE', from, to: from }
    scrollToId.current = section.id
    setExpanded((current) => new Set([...current, section.id]))
    setPage(from)
    update([...sections, section])
  }

  // Gezogene Karte unter den Zeiger setzen (Lage im Inhalt, unabhängig vom Scrollen der Liste)
  function placeDragged() {
    const state = drag.current
    const list = listRef.current
    const element = state && cards.current.get(state.id)
    if (!state || !list || !element) return
    const pointerInList = state.pointerY - list.getBoundingClientRect().top + list.scrollTop
    element.style.transform = `translateY(${pointerInList - state.grabOffset - element.offsetTop}px)`
  }

  // Neue Stelle: Mitte der gezogenen Karte gegenüber den Mitten der übrigen Karten (Layout-Lage ohne Verschiebung)
  const dragTo = useCallback(() => {
    const state = drag.current
    const list = listRef.current
    if (!state || !list) return
    const pointerInList = state.pointerY - list.getBoundingClientRect().top + list.scrollTop
    setSections((current) => {
      const dragged = cards.current.get(state.id)
      if (!dragged) return current
      const center = pointerInList - state.grabOffset + dragged.offsetHeight / 2
      const others = current.filter((section) => section.id !== state.id)
      let index = others.findIndex((section) => {
        const element = cards.current.get(section.id)
        return element ? center < element.offsetTop + element.offsetHeight / 2 : false
      })
      if (index === -1) index = others.length
      const next = [...others.slice(0, index), current.find((section) => section.id === state.id)!, ...others.slice(index)]
      if (next.every((section, position) => section === current[position])) return current
      rememberPositions()
      setDirty(true)
      return next
    })
    placeDragged()
  }, [])

  const startDrag = (id: string, event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    const element = cards.current.get(id)
    const list = listRef.current
    if (!element || !list) return
    event.preventDefault()
    const pointerInList = event.clientY - list.getBoundingClientRect().top + list.scrollTop
    drag.current = { id, grabOffset: pointerInList - element.offsetTop, pointerY: event.clientY }
    setDragId(id)
  }

  useEffect(() => {
    if (!dragId) return
    let frame = 0
    // Am oberen und unteren Rand der Liste weiterscrollen, solange gezogen wird
    const autoScroll = () => {
      const list = listRef.current
      const state = drag.current
      if (list && state) {
        const rect = list.getBoundingClientRect()
        const edge = 48
        const speed = state.pointerY < rect.top + edge ? -(rect.top + edge - state.pointerY) / 3 : state.pointerY > rect.bottom - edge ? (state.pointerY - rect.bottom + edge) / 3 : 0
        if (speed) {
          list.scrollTop += Math.max(-16, Math.min(16, speed))
          dragTo()
        }
      }
      frame = requestAnimationFrame(autoScroll)
    }
    frame = requestAnimationFrame(autoScroll)
    const onMove = (event: globalThis.PointerEvent) => {
      if (!drag.current) return
      drag.current.pointerY = event.clientY
      dragTo()
    }
    const onUp = () => {
      const element = drag.current && cards.current.get(drag.current.id)
      if (element) {
        const from = element.style.transform
        element.style.transform = ''
        element.animate([{ transform: from }, { transform: 'none' }], { duration: 250, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
      }
      drag.current = null
      setDragId(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [dragId, dragTo])

  // Mit der Tastatur (Pfeiltasten auf dem Griff) eine Stelle nach oben oder unten
  const move = (id: string, delta: -1 | 1) => {
    const index = sections.findIndex((section) => section.id === id)
    const target = index + delta
    if (index === -1 || target < 0 || target >= sections.length) return
    rememberPositions()
    const next = [...sections]
    ;[next[index], next[target]] = [next[target], next[index]]
    update(next)
    requestAnimationFrame(() => cards.current.get(id)?.querySelector<HTMLButtonElement>('button')?.focus())
  }

  // Trennlinie zwischen Abschnitten und Viewer: ziehbar, Standard 50/50
  const [split, setSplit] = useState(0.5)
  const columnsRef = useRef<HTMLDivElement>(null)
  const [resizing, setResizing] = useState(false)
  const clampSplit = (value: number) => {
    const width = columnsRef.current?.clientWidth ?? 1
    const min = Math.min(0.45, 380 / width)
    return Math.min(1 - min, Math.max(min, value))
  }
  useEffect(() => {
    if (!resizing) return
    const onMove = (event: globalThis.PointerEvent) => {
      const rect = columnsRef.current?.getBoundingClientRect()
      if (rect) setSplit(clampSplit((event.clientX - rect.left) / rect.width))
    }
    const onUp = () => setResizing(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [resizing])

  // «Reihenfolge aktualisieren»: Die Blöcke werden nach der ersten Seitenzahl geordnet
  const reorder = () => {
    rememberPositions()
    update([...sections].sort((a, b) => a.from - b.from || a.to - b.to))
  }

  return (
    <div className={styles.layout}>
      {/* Titel über die ganze Breite, darunter Abschnitte und Viewer nebeneinander */}
      <header className={styles.editorHeader}>
        <h2 className="body2-bold">{t.classification.title}</h2>
        <div className={styles.headerActions}>
          <Button variant="secondary" label={t.classification.updateOrder} icon={resetIcon} iconPosition="right" onClick={reorder} />
          <span className={styles.headerSeparator} aria-hidden="true" />
          <Button icon={closeIcon} aria-label={t.classification.close} onClick={onCancel} />
        </div>
      </header>
      <div ref={columnsRef} className={`${styles.columns} ${resizing ? styles.resizing : ''}`} style={{ '--split': `${split * 100}%` } as CSSProperties}>
        <section className={styles.editor} aria-label={t.classification.title}>
          <div ref={listRef} className={styles.editorContent}>
            <div className={styles.list}>
              {sections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  pageCount={pageCount}
                  expanded={expanded.has(section.id)}
                  onToggle={() => toggle(section)}
                  onChange={change}
                  onDelete={() => askDelete(section)}
                  dragging={dragId === section.id}
                  onDragStart={(event) => startDrag(section.id, event)}
                  onMove={(delta) => move(section.id, delta)}
                  cardRef={(element) => {
                    if (element) cards.current.set(section.id, element)
                    else cards.current.delete(section.id)
                  }}
                />
              ))}
            </div>
            <button type="button" className={styles.add} onClick={add}>
              <img src={plusIcon} alt="" />
              <span className="button-text">{t.classification.addSection}</span>
            </button>
          </div>
        </section>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t.classification.resize}
          aria-valuenow={Math.round(split * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          className={styles.divider}
          onPointerDown={(event) => {
            if (event.button !== 0) return
            event.preventDefault()
            setResizing(true)
          }}
          onDoubleClick={() => setSplit(0.5)}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
            event.preventDefault()
            setSplit((current) => clampSplit(current + (event.key === 'ArrowLeft' ? -0.02 : 0.02)))
          }}
        />

        <div className={styles.viewer}>
          <ViewerHeader files={files} file={file} page={page} onSelectFile={onSelectFile} onGoToPage={setPage} />
          <PdfViewer file={file} page={page} onPageChange={setPage} sections={sections} initialTocOpen={false} />
        </div>
      </div>

      <DeleteSectionDialog
        open={deleteOpen}
        title={pendingDelete ? sectionTitle(pendingDelete, t.pageClass) : ''}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false)
          if (pendingDelete) remove(pendingDelete.id)
        }}
      />

      <SaveBar dirty={dirty}>
        <Button variant="secondary-solid" label={t.classification.cancel} onClick={onCancel} />
        <Button variant="primary" label={t.classification.finish} onClick={() => onSave(sections)} />
      </SaveBar>
    </div>
  )
}
