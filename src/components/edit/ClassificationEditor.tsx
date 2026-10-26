import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '../Button'
import { Chip } from '../Chip'
import { SelectField, TextField } from '../FormField'
import { PdfViewer } from '../viewer/PdfViewer'
import { ViewerHeader } from '../viewer/ViewerHeader'
import { loadPdf } from '../viewer/pdf'
import { SaveBar } from './SaveBar'
import { CLASSES_WITHOUT_LANGUAGE, LANGUAGES, PAGE_CLASSES, newSectionId, pageRange, sectionTitle, type AssetFile, type Section } from '../../data/files'
import styles from './ClassificationEditor.module.css'
import resetIcon from '../../assets/icons/reset.svg'
import trashIcon from '../../assets/icons/trash.svg'
import chevronUpIcon from '../../assets/icons/chevron-up.svg'
import plusIcon from '../../assets/icons/plus-small.svg'

const NO_LANGUAGE = '–'

type SectionCardProps = {
  section: Section
  expanded: boolean
  pageCount: number
  onToggle: () => void
  onChange: (section: Section) => void
  onDelete: () => void
  cardRef: (element: HTMLDivElement | null) => void
}

function SectionCard({ section, expanded, pageCount, onToggle, onChange, onDelete, cardRef }: SectionCardProps) {
  const pages = Array.from({ length: pageCount }, (_, index) => ({ value: index + 1, label: String(index + 1) }))
  const showLanguage = section.language && !CLASSES_WITHOUT_LANGUAGE.includes(section.type)

  return (
    <div ref={cardRef} className={`${styles.card} ${expanded ? styles.expanded : ''}`}>
      <div className={styles.cardHeader}>
        <button type="button" className={styles.cardToggle} aria-expanded={expanded} onClick={onToggle}>
          <span className={`${styles.cardTitle} body3-bold`}>{sectionTitle(section)}</span>
          <span className={styles.cardChips}>
            <Chip tone="white">{section.type}</Chip>
            {showLanguage && <Chip tone="white">{section.language}</Chip>}
            <Chip tone="white">S. {pageRange(section)}</Chip>
          </span>
        </button>
        <div className={styles.cardActions}>
          <Button icon={trashIcon} aria-label="Abschnitt löschen" tooltip="Abschnitt löschen" onClick={onDelete} />
          <Button icon={chevronUpIcon} className={styles.chevron} aria-label={expanded ? 'Zuklappen' : 'Aufklappen'} onClick={onToggle} />
        </div>
      </div>
      <div className={styles.cardCollapse}>
        <div className={styles.cardClip}>
          <div className={styles.cardBody}>
            <TextField
              label="Label"
              help="Wenn kein Label angegeben ist, wird der Typ als Titel verwendet"
              value={section.label}
              placeholder={section.type}
              onChange={(label) => onChange({ ...section, label })}
            />
            <div className={styles.fieldRow}>
              <SelectField
                label="Typ"
                required
                className={styles.typeField}
                value={section.type}
                options={PAGE_CLASSES.map((type) => ({ value: type, label: type }))}
                onChange={(type) => onChange({ ...section, type })}
              />
              <SelectField
                label="Sprache"
                required
                className={styles.smallField}
                value={section.language ?? NO_LANGUAGE}
                options={[...LANGUAGES.map((language) => ({ value: language as string, label: language })), { value: NO_LANGUAGE, label: NO_LANGUAGE }]}
                onChange={(language) => onChange({ ...section, language: language === NO_LANGUAGE ? undefined : (language as Section['language']) })}
              />
              <SelectField
                label="Seite von"
                required
                className={styles.smallField}
                value={section.from}
                options={pages}
                onChange={(from) => onChange({ ...section, from, to: Math.max(from, section.to) })}
              />
              <SelectField
                label="Seite bis"
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

  // FLIP: Karten gleiten nach dem Umsortieren oder Löschen an ihre neue Position
  const rememberPositions = () => {
    positions.current = new Map([...cards.current].map(([id, element]) => [id, element.getBoundingClientRect().top]))
  }
  useLayoutEffect(() => {
    const before = positions.current
    positions.current = null
    if (before) {
      for (const [id, element] of cards.current) {
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

  const add = () => {
    const last = sections.reduce((max, section) => Math.max(max, section.to), 0)
    const from = Math.min(last + 1, pageCount)
    const section: Section = { id: newSectionId(), label: '', type: 'Text', language: 'DE', from, to: from }
    scrollToId.current = section.id
    setExpanded((current) => new Set([...current, section.id]))
    setPage(from)
    update([...sections, section])
  }

  // «Reihenfolge aktualisieren»: Die Blöcke werden nach der ersten Seitenzahl geordnet
  const reorder = () => {
    rememberPositions()
    update([...sections].sort((a, b) => a.from - b.from || a.to - b.to))
  }

  return (
    <div className={styles.layout}>
      <div className={styles.columns}>
        <section className={styles.editor} aria-label="Klassifizierung">
          <header className={styles.editorHeader}>
            <h2 className="body2-bold">Klassifizierung</h2>
            <Button variant="secondary" label="Reihenfolge aktualisieren" icon={resetIcon} iconPosition="right" onClick={reorder} />
          </header>
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
                  onDelete={() => remove(section.id)}
                  cardRef={(element) => {
                    if (element) cards.current.set(section.id, element)
                    else cards.current.delete(section.id)
                  }}
                />
              ))}
            </div>
            <button type="button" className={styles.add} onClick={add}>
              <img src={plusIcon} alt="" />
              <span className="button-text">Abschnitt hinzufügen</span>
            </button>
          </div>
        </section>

        <div className={styles.viewer}>
          <ViewerHeader files={files} file={file} page={page} onSelectFile={onSelectFile} onGoToPage={setPage} onClose={onCancel} />
          <PdfViewer file={file} page={page} onPageChange={setPage} sections={sections} initialTocOpen={false} />
        </div>
      </div>

      <SaveBar dirty={dirty}>
        <Button variant="secondary-solid" label="Abbrechen" onClick={onCancel} />
        <Button variant="primary" label="Bearbeitung beenden" onClick={() => onSave(sections)} />
      </SaveBar>
    </div>
  )
}
