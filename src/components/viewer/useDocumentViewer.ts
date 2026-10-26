import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Der PDF-Viewer wird über die Query-Parameter doc (Datei-ID) und page gesteuert */
export function useDocumentViewer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const docId = searchParams.get('doc')
  const page = Number(searchParams.get('page')) || 1

  const openDocument = useCallback(
    (fileId: string, targetPage = 1) => {
      setSearchParams((params) => {
        params.set('doc', fileId)
        params.set('page', String(targetPage))
        return params
      })
    },
    [setSearchParams],
  )

  const setPage = useCallback(
    (targetPage: number) => {
      setSearchParams(
        (params) => {
          params.set('page', String(targetPage))
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const closeDocument = useCallback(() => {
    setSearchParams((params) => {
      params.delete('doc')
      params.delete('page')
      return params
    })
  }, [setSearchParams])

  return { docId, page, isOpen: Boolean(docId), openDocument, setPage, closeDocument }
}
