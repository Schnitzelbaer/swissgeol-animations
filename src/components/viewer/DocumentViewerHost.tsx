import { useEffect, useState } from 'react'
import { Modal } from '../Modal'
import { PdfViewer } from './PdfViewer'
import { ViewerHeader } from './ViewerHeader'
import { useDocumentViewer } from './useDocumentViewer'
import { useStore } from '../../data/store'
import type { AssetFile } from '../../data/files'

/** PDF-Viewer als Modal über jeder Seite; gesteuert über ?doc=<Datei-ID>&page=<Seite> */
export function DocumentViewerHost() {
  const { files, getFile } = useStore()
  const { docId, page, openDocument, setPage, closeDocument } = useDocumentViewer()
  const file = getFile(docId)
  const open = Boolean(file?.url)

  // Beim Schliessen bleibt die letzte Datei sichtbar, bis das Modal ausgeblendet ist
  const [shown, setShown] = useState<AssetFile | undefined>(file)
  useEffect(() => {
    if (file?.url) setShown(file)
  }, [file])

  const pdfFiles = files.filter((candidate) => candidate.url)

  return (
    <Modal open={open} onClose={closeDocument} label="Datei-Viewer">
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
