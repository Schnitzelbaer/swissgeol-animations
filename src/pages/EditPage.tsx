import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { useTooltip } from '../components/Tooltip'
import { FilesTable } from '../components/edit/FilesTable'
import { AnalysisDialog } from '../components/edit/AnalysisDialog'
import { ClassificationEditor } from '../components/edit/ClassificationEditor'
import { SaveBar } from '../components/edit/SaveBar'
import { useDocumentViewer } from '../components/viewer/useDocumentViewer'
import { useStore } from '../data/store'
import { asset } from '../data/asset'
import type { AssetFile } from '../data/files'
import styles from './EditPage.module.css'
import backIcon from '../assets/icons/back.svg'
import duplicateIcon from '../assets/icons/header-duplicate.svg'
import exportIcon from '../assets/icons/header-export.svg'
import trashIcon from '../assets/icons/header-trash.svg'
import discardIcon from '../assets/icons/trash-discard.svg'
import saveIcon from '../assets/icons/save.svg'
import sidebarIcon from '../assets/icons/sidebar-toggle.svg'

const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'files', label: 'Files' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'references', label: 'References' },
  { id: 'geometries', label: 'Geometries' },
  { id: 'altdaten', label: 'Altdaten' },
  { id: 'status', label: 'Status' },
]

function formatDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(/\.0$/, '')}MB`
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

let uploadCounter = 0
function toAssetFile(file: File, legal: boolean): AssetFile {
  uploadCounter += 1
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  return {
    id: `upload-${uploadCounter}`,
    name: file.name,
    format: isPdf ? 'PDF' : 'DB',
    size: formatSize(file.size),
    uploaded: formatDate(new Date()),
    url: URL.createObjectURL(file),
    legal,
    sections: [],
  }
}

function SidepanelToggle({ onClick }: { onClick: () => void }) {
  const { handlers, tooltip } = useTooltip('Datei-Viewer öffnen')
  return (
    <button type="button" className={styles.sidepanelToggle} aria-label="Datei-Viewer öffnen" onClick={onClick} {...handlers}>
      <img src={sidebarIcon} alt="" />
      {tooltip}
    </button>
  )
}

/**
 * Bearbeiten-Seite eines Assets (Figma «Standort» 20844:27353).
 * Routen: /asset/:id/edit/:section; Query-Parameter tab=legal und classify=<Datei-ID>.
 */
export function EditPage() {
  const navigate = useNavigate()
  const { section = 'files' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { files, saveFiles, analysing, startAnalysis, updateSections, getFile } = useStore()
  const { openDocument } = useDocumentViewer()
  const [draft, setDraft] = useState(files)
  const [analysisRequest, setAnalysisRequest] = useState<string[] | null>(null)

  // Gespeicherte Änderungen (z.B. aus der Klassifizierung) in den Entwurf übernehmen
  useEffect(() => {
    setDraft((current) => current.map((file) => getFile(file.id) ?? file))
  }, [files, getFile])

  const tab = searchParams.get('tab') === 'legal' ? 'legal' : 'normal'
  const classifyId = searchParams.get('classify')
  const classifyFile = draft.find((file) => file.id === classifyId && file.format === 'PDF')
  const [shownClassifyFile, setShownClassifyFile] = useState(classifyFile)
  useEffect(() => {
    if (classifyFile) setShownClassifyFile(classifyFile)
  }, [classifyFile])

  const dirty = draft.length !== files.length || draft.some((file, index) => file.id !== files[index]?.id)
  const tabFiles = draft.filter((file) => Boolean(file.legal) === (tab === 'legal'))
  const pdfFiles = draft.filter((file) => file.url && file.format === 'PDF')

  const setParam = (key: string, value: string | null) =>
    setSearchParams((params) => {
      if (value) params.set(key, value)
      else params.delete(key)
      return params
    })

  const saveClassification = (fileId: string, sections: AssetFile['sections'] = []) => {
    if (getFile(fileId)) updateSections(fileId, sections)
    setDraft((current) => current.map((file) => (file.id === fileId ? { ...file, sections } : file)))
    setParam('classify', null)
  }

  return (
    <div className={styles.page}>
      <Header showSearch={false} />

      <div className={styles.detailHeader}>
        <div className={styles.detailTitle}>
          <Button variant="primary" icon={backIcon} aria-label="Zurück zur Karte" tooltip="Zurück" onClick={() => navigate(`/asset/${asset.id}`)} />
          <h1 className={`${styles.title} body2-bold`}>{asset.title}</h1>
          <span className={styles.statusChips}>
            <span className={`${styles.statusChip} ${styles.reviewed}`}>{asset.status}</span>
            <span className={`${styles.statusChip} ${styles.assignee}`}>Matthias Walder</span>
          </span>
        </div>
        <div className={styles.detailActions}>
          <Button variant="secondary" label="Duplizieren" icon={duplicateIcon} iconPosition="right" />
          <Button variant="secondary" label="Export" icon={exportIcon} iconPosition="right" />
          <Button variant="secondary" label="Asset Löschen" icon={trashIcon} iconPosition="right" />
        </div>
      </div>

      <div className={styles.body}>
        <nav className={styles.nav} aria-label="Bereiche">
          {SECTIONS.map((item) => (
            <Link
              key={item.id}
              to={`/asset/${asset.id}/edit/${item.id}`}
              className={`${styles.navItem} ${item.id === section ? styles.navActive : ''}`}
              aria-current={item.id === section ? 'page' : undefined}
            >
              <span className="ellipsis">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.main}>
          <div className={styles.scroll}>
            {section === 'files' ? (
              <div className={styles.content}>
                <div className={styles.tabs} role="tablist">
                  <button type="button" role="tab" aria-selected={tab === 'normal'} className={`${styles.tab} ${tab === 'normal' ? styles.tabActive : ''}`} onClick={() => setParam('tab', null)}>
                    Normale Dateien
                  </button>
                  <button type="button" role="tab" aria-selected={tab === 'legal'} className={`${styles.tab} ${tab === 'legal' ? styles.tabActive : ''}`} onClick={() => setParam('tab', 'legal')}>
                    Rechtliche Einwilligungen
                  </button>
                </div>
                <div className={`${styles.tabPanel} ${tab === 'legal' ? styles.tabPanelLegal : ''}`} role="tabpanel">
                  <FilesTable
                    key={tab}
                    files={tabFiles}
                    analysing={analysing}
                    onUpload={(uploads) => setDraft((current) => [...current, ...uploads.map((file) => toAssetFile(file, tab === 'legal'))])}
                    onDelete={(ids) => setDraft((current) => current.filter((file) => !ids.includes(file.id)))}
                    onAnalyse={setAnalysisRequest}
                    onClassify={(id) => setParam('classify', id)}
                  />
                </div>
              </div>
            ) : (
              <p className={styles.placeholder}>Dieser Bereich ist im Prototyp nicht nachgebaut.</p>
            )}
          </div>

          <SaveBar dirty={dirty}>
            <Button variant="secondary-solid" label="Änderungen verwerfen" icon={discardIcon} iconPosition="right" disabled={!dirty} onClick={() => setDraft(files)} />
            <Button variant="primary" label="Speichern" icon={saveIcon} iconPosition="right" disabled={!dirty} onClick={() => saveFiles(draft)} />
          </SaveBar>
        </div>

        {pdfFiles.length > 0 && <SidepanelToggle onClick={() => openDocument(pdfFiles[0].id, 1)} />}
      </div>

      <AnalysisDialog
        open={analysisRequest !== null}
        onCancel={() => setAnalysisRequest(null)}
        onConfirm={() => {
          if (analysisRequest) startAnalysis(analysisRequest)
          setAnalysisRequest(null)
        }}
      />

      <Modal open={Boolean(classifyFile)} onClose={() => setParam('classify', null)} label="Klassifizierung">
        {shownClassifyFile && (
          <ClassificationEditor
            key={shownClassifyFile.id}
            file={shownClassifyFile}
            files={pdfFiles}
            onCancel={() => setParam('classify', null)}
            onSave={(sections) => saveClassification(shownClassifyFile.id, sections)}
            onSelectFile={(fileId) => setParam('classify', fileId)}
          />
        )}
      </Modal>
    </div>
  )
}
