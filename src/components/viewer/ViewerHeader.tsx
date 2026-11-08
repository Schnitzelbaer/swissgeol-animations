import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button, ButtonLink } from '../Button'
import type { AssetFile } from '../../data/files'
import { loadPageTexts } from './pdf'
import { useI18n } from '../../i18n'
import styles from './ViewerHeader.module.css'
import chevronDownIcon from '../../assets/icons/chevron-down.svg'
import downloadIcon from '../../assets/icons/download.svg'
import searchIcon from '../../assets/icons/search-viewer.svg'
import closeIcon from '../../assets/icons/close.svg'
import pdfIcon from '../../assets/icons/filetype-pdf.svg'
import csvIcon from '../../assets/icons/filetype-csv.svg'

/** Dateityp-Icon wie in der Dokumentliste: PDF eigenes Symbol, übrige Formate das Tabellen-Symbol */
function FileTypeIcon({ file }: { file: AssetFile }) {
  return <img src={file.format === 'PDF' ? pdfIcon : csvIcon} alt="" className={styles.fileIcon} />
}

function FileDropdown({ files, current, onSelect }: { files: AssetFile[]; current: AssetFile; onSelect: (fileId: string) => void }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div ref={rootRef} className={`${styles.dropdown} ${open ? styles.open : ''}`}>
      <div className={styles.card}>
        <button type="button" className={styles.dropdownButton} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
          <FileTypeIcon file={current} />
          <span className="button-text ellipsis">{current.name}</span>
          <img src={chevronDownIcon} alt="" className={styles.dropdownChevron} />
        </button>
      </div>
      <ul className={styles.menu} role="listbox" aria-label={t.viewer.chooseFile}>
        {files.map((file) => (
          <li key={file.id}>
            <button
              type="button"
              role="option"
              aria-selected={file.id === current.id}
              className={`${styles.option} ${file.id === current.id ? styles.selected : ''}`}
              onClick={() => {
                setOpen(false)
                onSelect(file.id)
              }}
            >
              <span className={styles.optionName}>
                <FileTypeIcon file={file} />
                <span className="ellipsis">{file.name}</span>
              </span>
              <span className={styles.optionMeta}>{file.pages && t.viewer.pages(file.pages)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Suche in der Textebene (OCR) der Scans; Enter springt zur nächsten Seite mit Treffer */
function Search({ file, page, onGoToPage }: { file: AssetFile; page: number; onGoToPage: (page: number) => void }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<number[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    setMatches(null)
    if (!file.url || query.trim().length < 2) return
    let cancelled = false
    const needle = query.trim().toLowerCase()
    loadPageTexts(file.url).then((texts) => {
      if (cancelled) return
      setMatches(texts.flatMap((text, index) => (text.toLowerCase().includes(needle) ? [index + 1] : [])))
    })
    return () => {
      cancelled = true
    }
  }, [file.url, query])

  const next = () => {
    if (!matches?.length) return
    onGoToPage(matches.find((match) => match > page) ?? matches[0])
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') next()
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className={`${styles.search} ${open ? styles.searchOpen : ''}`}>
      <Button variant="tertiary-dark" icon={searchIcon} aria-label={t.viewer.search} tooltip={t.viewer.search} aria-expanded={open} onClick={() => setOpen(!open)} />
      <div className={styles.searchField}>
        <input
          ref={inputRef}
          value={query}
          placeholder={t.viewer.searchPlaceholder}
          aria-label={t.viewer.searchTerm}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          tabIndex={open ? 0 : -1}
        />
        {matches && <span className={styles.matches}>{t.viewer.matches(matches.length)}</span>}
      </div>
    </div>
  )
}

type Props = {
  files: AssetFile[]
  file: AssetFile
  page: number
  onSelectFile: (fileId: string) => void
  onGoToPage: (page: number) => void
  onClose?: () => void
}

/** Kopfzeile des Datei-Viewers: Dateiwahl, dann Download, Suche und Schliessen als Tertiary-Buttons für dunklen Grund (weisses Icon, ohne Kachel) */
export function ViewerHeader({ files, file, page, onSelectFile, onGoToPage, onClose }: Props) {
  const { t } = useI18n()
  return (
    <header className={styles.header}>
      <div className={styles.group}>
        <FileDropdown files={files} current={file} onSelect={onSelectFile} />
        <ButtonLink variant="tertiary-dark" icon={downloadIcon} href={file.url} download={file.name} aria-label={t.viewer.download} tooltip={t.viewer.download} />
        <Search key={file.id} file={file} page={page} onGoToPage={onGoToPage} />
      </div>
      {onClose && (
        <Button variant="tertiary-dark" icon={closeIcon} aria-label={t.viewer.close} tooltip={t.viewer.close} onClick={onClose} />
      )}
    </header>
  )
}
