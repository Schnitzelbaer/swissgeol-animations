import { useEffect, useState } from 'react'
import { Modal } from '../Modal'
import { PdfViewer } from './PdfViewer'
import { ViewerHeader } from './ViewerHeader'
import { useDocumentViewer } from './useDocumentViewer'
import { useStore } from '../../data/store'
import type { AssetFile } from '../../data/files'
import { useI18n } from '../../i18n'

/** PDF-Viewer als Modal über jeder Seite; gesteuert über ?doc=<Datei-ID>&page=<Seite> */
export function DocumentViewerHost() {
  const { t } = useI18n()
  const { files, getFile } = useStore()
  const { docId, page, openDocument, setPage, closeDocument } = useDocumentViewer()
  const file = getFile(docId)
  const open = Boolean(file?.url)

  // Beim Schliessen bleibt die letzte Datei sichtbar, bis das Modal ausgeblendet ist
  const [shown, setShown] = useState<AssetFile | undefined>(file)
  useEffect(() => {
    if (file?.url) setShown(file)
  }, [file])

  // Dateiwahl im Viewer: nur PDFs desselben Assets
  const pdfFiles = files.filter((candidate) => candidate.url && candidate.assetId === shown?.assetId)

  return (
    <Modal open={open} onClose={closeDocument} label={t.viewer.label}>
      {shown && (
        <>
          <ViewerHeader
            files={pdfFiles}
            file={shown}
            page={page}
            onSelectFile={(fileId) => openDocument(fileId, 1)}
            onGoToPage={setPage}
            onClose={closeDocument}
          />
          <PdfViewer key={shown.id} file={shown} page={page} onPageChange={setPage} />
        </>
      )}
    </Modal>
  )
}
