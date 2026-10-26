import { useEffect, useRef, useState } from 'react'
import { Button, ButtonLink } from '../Button'
import { TruncatedText } from '../Tooltip'
import type { AssetFile } from '../../data/files'
import styles from './FilesTable.module.css'
import uploadIcon from '../../assets/icons/upload.svg'
import toolbarTrashIcon from '../../assets/icons/toolbar-trash.svg'
import toolbarDownloadIcon from '../../assets/icons/toolbar-download.svg'
import analyseGreyIcon from '../../assets/icons/analyse-grey.svg'
import searchIcon from '../../assets/icons/search-table.svg'
import sortIcon from '../../assets/icons/sort-arrow.svg'
import rowTrashIcon from '../../assets/icons/row-trash.svg'
import rowDownloadIcon from '../../assets/icons/row-download.svg'
import rowAnalyseIcon from '../../assets/icons/row-analyse.svg'
import rowClassifyIcon from '../../assets/icons/row-classify.svg'
import rowClassifyGreyIcon from '../../assets/icons/row-classify-grey.svg'
import spinnerIcon from '../../assets/icons/spinner.svg'
import trashIcon from '../../assets/icons/trash.svg'
import downloadIcon from '../../assets/icons/download.svg'

function Checkbox({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: () => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])
  return <input ref={ref} type="checkbox" className={styles.checkbox} checked={checked} onChange={onChange} aria-label={label} />
}

function UploadField({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  return (
    <div
      className={`${styles.upload} ${dragging ? styles.dragging : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        onFiles([...event.dataTransfer.files])
      }}
    >
      {/* Lange Striche wie in Figma; CSS-«dashed» wäre zu fein */}
      <svg className={styles.uploadBorder} aria-hidden>
        <rect x="1" y="1" rx="4" />
      </svg>
      <span className={styles.uploadTitle}>
        <img src={uploadIcon} alt="" />
        <span className="button-text">Datei hochladen</span>
      </span>
      <span className={`${styles.uploadHint} button-text`}>Click to browse, or drag &amp; drop a file here</span>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          onFiles([...(event.target.files ?? [])])
          event.target.value = ''
        }}
      />
    </div>
  )
}

type Props = {
  files: AssetFile[]
  analysing: Set<string>
  onUpload: (files: File[]) => void
  onDelete: (ids: string[]) => void
  onAnalyse: (ids: string[]) => void
  onClassify: (id: string) => void
}

/** Dateitabelle der Bearbeiten-Seite: Upload, Auswahl, Suche, Sortierung und Aktionen pro Zeile */
export function FilesTable({ files, analysing, onUpload, onDelete, onAnalyse, onClassify }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [descending, setDescending] = useState(false)

  const visible = files
    .filter((file) => file.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => (descending ? -1 : 1) * a.name.localeCompare(b.name, 'de', { numeric: true }))
  const selectedFiles = files.filter((file) => selected.has(file.id))
  const analysable = selectedFiles.filter((file) => file.format === 'PDF' && !analysing.has(file.id))
  const allSelected = visible.length > 0 && visible.every((file) => selected.has(file.id))

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const exportSelected = () => {
    for (const file of selectedFiles) {
      if (!file.url) continue
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      link.click()
    }
  }

  return (
    <div className={styles.root}>
      <UploadField onFiles={onUpload} />

      <div className={styles.table}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarActions}>
            <Button
              variant={selectedFiles.length ? 'secondary' : 'disabled'}
              icon={selectedFiles.length ? trashIcon : toolbarTrashIcon}
              label="Löschen"
              disabled={!selectedFiles.length}
              onClick={() => {
                onDelete([...selected])
                setSelected(new Set())
              }}
            />
            <Button
              variant={selectedFiles.length ? 'secondary' : 'disabled'}
              icon={selectedFiles.length ? downloadIcon : toolbarDownloadIcon}
              label="Export"
              disabled={!selectedFiles.length}
              onClick={exportSelected}
            />
            <Button
              variant={analysable.length ? 'secondary' : 'disabled'}
              icon={analysable.length ? rowAnalyseIcon : analyseGreyIcon}
              label="Neu analysieren"
              disabled={!analysable.length}
              onClick={() => onAnalyse(analysable.map((file) => file.id))}
            />
          </div>
          <label className={styles.search}>
            <img src={searchIcon} alt="" />
            <input value={query} placeholder="Suche..." aria-label="Dateien durchsuchen" onChange={(event) => setQuery(event.target.value)} />
          </label>
        </div>

        <div className={styles.grid} role="table" aria-label="Dateien">
          <div className={`${styles.row} ${styles.head}`} role="row">
            <div className={styles.checkCell} role="columnheader">
              <Checkbox
                checked={allSelected}
                indeterminate={!allSelected && visible.some((file) => selected.has(file.id))}
                label="Alle auswählen"
                onChange={() => setSelected(allSelected ? new Set() : new Set(visible.map((file) => file.id)))}
              />
            </div>
            <button type="button" className={`${styles.nameHead} ${descending ? styles.descending : ''}`} role="columnheader" onClick={() => setDescending(!descending)}>
              <img src={sortIcon} alt="" />
              <span className="body3-bold">Name</span>
            </button>
            <div className={`${styles.dateCell} body3-bold`} role="columnheader">
              Hochgeladen
            </div>
            <div className={styles.actionsCell} role="columnheader" aria-label="Aktionen" />
          </div>

          {visible.map((file) => {
            const running = analysing.has(file.id)
            const isPdf = file.format === 'PDF'
            return (
              <div key={file.id} className={`${styles.row} ${selected.has(file.id) ? styles.selectedRow : ''}`} role="row">
                <div className={styles.checkCell} role="cell">
                  <Checkbox checked={selected.has(file.id)} label={`${file.name} auswählen`} onChange={() => toggle(file.id)} />
                </div>
                {/* Ohne laufende Analyse nutzt der Name auch die OCR-Spalte */}
                <div className={`${styles.nameCell} ${running ? '' : styles.nameWide}`} role="cell">
                  <TruncatedText text={file.name} className={styles.cellText} />
                </div>
                {running && (
                  <div className={styles.ocrCell} role="cell">
                    <span className={styles.analysing}>
                      <span className={styles.cellText}>analyse</span>
                      <img src={spinnerIcon} alt="" className={styles.spinner} />
                    </span>
                  </div>
                )}
                <div className={`${styles.dateCell} ${styles.cellText}`} role="cell">
                  {file.uploaded}
                </div>
                <div className={styles.actionsCell} role="cell">
                  <Button variant="secondary" small icon={rowTrashIcon} aria-label={`${file.name} löschen`} tooltip="Löschen" onClick={() => onDelete([file.id])} />
                  {file.url ? (
                    <ButtonLink variant="secondary" small icon={rowDownloadIcon} href={file.url} download={file.name} aria-label={`${file.name} herunterladen`} tooltip="Herunterladen" />
                  ) : (
                    <Button variant="disabled" small icon={toolbarDownloadIcon} aria-label={`${file.name} herunterladen`} disabled />
                  )}
                  <Button
                    variant={isPdf && !running ? 'secondary' : 'disabled'}
                    small
                    icon={isPdf && !running ? rowAnalyseIcon : analyseGreyIcon}
                    aria-label={`${file.name} neu analysieren`}
                    tooltip={isPdf ? 'Neu analysieren' : 'Nur PDFs werden analysiert'}
                    disabled={!isPdf || running}
                    onClick={() => onAnalyse([file.id])}
                  />
                  <Button
                    variant={isPdf ? 'secondary' : 'disabled'}
                    small
                    icon={isPdf ? rowClassifyIcon : rowClassifyGreyIcon}
                    aria-label={`${file.name} klassifizieren`}
                    tooltip={isPdf ? 'Klassifizieren' : 'Nur PDFs werden klassifiziert'}
                    disabled={!isPdf}
                    onClick={() => onClassify(file.id)}
                  />
                </div>
              </div>
            )
          })}
          {visible.length === 0 && <p className={styles.empty}>Keine Dateien gefunden.</p>}
        </div>
      </div>
    </div>
  )
}
