import { useEffect, useRef, useState } from 'react'
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
import { DEFAULT_ASSET_ID, getAsset } from '../data/assets'
import type { AssetFile } from '../data/files'
import { useI18n } from '../i18n'
import styles from './EditPage.module.css'
import backIcon from '../assets/icons/back.svg'
import duplicateIcon from '../assets/icons/header-duplicate.svg'
import exportIcon from '../assets/icons/header-export.svg'
import { AssetMoreMenu } from '../components/edit/AssetMoreMenu'
import discardIcon from '../assets/icons/trash-discard.svg'
import saveIcon from '../assets/icons/save.svg'
import sidebarIcon from '../assets/icons/sidebar-toggle.svg'

const SECTIONS = ['general', 'files', 'contacts', 'references', 'geometries', 'altdaten', 'status'] as const

function formatDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(/\.0$/, '')}MB`
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

let uploadCounter = 0
function toAssetFile(file: File, assetId: string, legal: boolean): AssetFile {
  uploadCounter += 1
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  return {
    id: `upload-${uploadCounter}`,
    assetId,
    name: file.name,
    format: isPdf ? 'PDF' : 'DB',
    size: formatSize(file.size),
    uploaded: formatDate(new Date()),
    url: URL.createObjectURL(file),
    legal,
    sections: [],
    // Wird direkt nach dem Hochladen analysiert (nur PDFs); bis dahin «nicht analysiert»
    analysed: false,
  }
}

function SidepanelToggle({ onClick }: { onClick: () => void }) {
  const { t } = useI18n()
  const { handlers, tooltip } = useTooltip(t.edit.openViewer)
  return (
    <button type="button" className={styles.sidepanelToggle} aria-label={t.edit.openViewer} onClick={onClick} {...handlers}>
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
  const { t } = useI18n()
  const { assetId, section = 'files' } = useParams()
  const asset = getAsset(assetId) ?? getAsset(DEFAULT_ASSET_ID)!
  const [searchParams, setSearchParams] = useSearchParams()
  const { files, saveFiles, analysing, startAnalysis, analysisResults, updateSections, getFile } = useStore()
  const assetFiles = files.filter((file) => file.assetId === asset.id)
  const { openDocument } = useDocumentViewer()
  const [draft, setDraft] = useState(assetFiles)
  const [analysisRequest, setAnalysisRequest] = useState<string[] | null>(null)

  // Anderes Asset: Entwurf neu beginnen
  const [draftAssetId, setDraftAssetId] = useState(asset.id)
  if (draftAssetId !== asset.id) {
    setDraftAssetId(asset.id)
    setDraft(assetFiles)
  }

  // Gespeicherte Änderungen (z.B. aus der Klassifizierung) in den Entwurf übernehmen
  useEffect(() => {
    setDraft((current) => current.map((file) => getFile(file.id) ?? file))
  }, [files, getFile])

  // Fertige Analysen in den Entwurf übernehmen (auch für hochgeladene, noch nicht gespeicherte Dateien), je Lauf einmal
  const appliedRuns = useRef(new Map<string, number>())
  useEffect(() => {
    const fresh = [...analysisResults].filter(([id, { run }]) => appliedRuns.current.get(id) !== run)
    if (!fresh.length) return
    for (const [id, { run }] of fresh) appliedRuns.current.set(id, run)
    setDraft((current) =>
      current.map((file) => {
        const entry = analysisResults.get(file.id)
        if (!entry || !fresh.some(([id]) => id === file.id)) return file
        return entry.result
          ? { ...file, sections: entry.result.sections, pages: entry.result.pages, languages: entry.result.languages, analysed: true }
          : { ...file, analysed: false }
      }),
    )
  }, [analysisResults])

  const tab = searchParams.get('tab') === 'legal' ? 'legal' : 'normal'
  const classifyId = searchParams.get('classify')
  const classifyFile = draft.find((file) => file.id === classifyId && file.format === 'PDF')
  const [shownClassifyFile, setShownClassifyFile] = useState(classifyFile)
  useEffect(() => {
    if (classifyFile) setShownClassifyFile(classifyFile)
  }, [classifyFile])

  const dirty = draft.length !== assetFiles.length || draft.some((file, index) => file.id !== assetFiles[index]?.id)
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
          <Button variant="primary" icon={backIcon} aria-label={t.edit.backToMap} tooltip={t.edit.back} onClick={() => navigate(`/asset/${asset.id}`)} />
          <h1 className={`${styles.title} body2-bold`}>{asset.title}</h1>
          <span className={styles.statusChips}>
            <span className={`${styles.statusChip} ${styles.reviewed}`}>{t.codes.status[asset.status]}</span>
            <span className={`${styles.statusChip} ${styles.assignee}`}>Matthias Walder</span>
          </span>
        </div>
        <div className={styles.detailActions}>
          {/* «Delete asset» liegt im Kontextmenü links von «Duplicate» */}
          <AssetMoreMenu />
          <Button variant="secondary" label={t.edit.duplicate} icon={duplicateIcon} iconPosition="right" />
          <Button variant="secondary" label={t.edit.export} icon={exportIcon} iconPosition="right" />
        </div>
      </div>

      <div className={styles.body}>
        <nav className={styles.nav} aria-label={t.edit.sectionsLabel}>
          {SECTIONS.map((id) => (
            <Link
              key={id}
              to={`/asset/${asset.id}/edit/${id}`}
              className={`${styles.navItem} ${id === section ? styles.navActive : ''}`}
              aria-current={id === section ? 'page' : undefined}
            >
              <span className="ellipsis">{t.edit.sections[id]}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.main}>
          <div className={styles.scroll}>
            {section === 'files' ? (
              <div className={styles.content}>
                <div className={styles.tabs} role="tablist">
                  <button type="button" role="tab" aria-selected={tab === 'normal'} className={`${styles.tab} ${tab === 'normal' ? styles.tabActive : ''}`} onClick={() => setParam('tab', null)}>
                    {t.edit.normalFiles}
                  </button>
                  <button type="button" role="tab" aria-selected={tab === 'legal'} className={`${styles.tab} ${tab === 'legal' ? styles.tabActive : ''}`} onClick={() => setParam('tab', 'legal')}>
                    {t.edit.legalFiles}
                  </button>
                </div>
                <div className={`${styles.tabPanel} ${tab === 'legal' ? styles.tabPanelLegal : ''}`} role="tabpanel">
                  <FilesTable
                    key={tab}
                    legal={tab === 'legal'}
                    files={tabFiles}
                    analysing={analysing}
                    onUpload={(uploads) => {
                      // Neue Dateien kommen in den Entwurf, PDFs werden sofort analysiert
                      const added = uploads.map((file) => toAssetFile(file, asset.id, tab === 'legal'))
                      setDraft((current) => [...current, ...added])
                      startAnalysis(added)
                    }}
                    onDelete={(ids) => setDraft((current) => current.filter((file) => !ids.includes(file.id)))}
                    onAnalyse={setAnalysisRequest}
                    onClassify={(id) => setParam('classify', id)}
                  />
                </div>
              </div>
            ) : (
              <p className={styles.placeholder}>{t.edit.notBuilt}</p>
            )}
          </div>

          <SaveBar dirty={dirty}>
            <Button variant="secondary-solid" label={t.edit.discard} icon={discardIcon} iconPosition="right" disabled={!dirty} onClick={() => setDraft(assetFiles)} />
            <Button variant="primary" label={t.edit.save} icon={saveIcon} iconPosition="right" disabled={!dirty} onClick={() => saveFiles(asset.id, draft)} />
          </SaveBar>
        </div>

        {pdfFiles.length > 0 && <SidepanelToggle onClick={() => openDocument(pdfFiles[0].id, 1)} />}
      </div>

      <AnalysisDialog
        open={analysisRequest !== null}
        onCancel={() => setAnalysisRequest(null)}
        onConfirm={() => {
          if (analysisRequest) startAnalysis(draft.filter((file) => analysisRequest.includes(file.id)))
          setAnalysisRequest(null)
        }}
      />

      <Modal open={Boolean(classifyFile)} onClose={() => setParam('classify', null)} label={t.classification.title}>
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
