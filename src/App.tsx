import { Navigate, Route, Routes } from 'react-router-dom'
import { MapPage } from './pages/MapPage'
import { EditPage } from './pages/EditPage'
import { DocumentViewerHost } from './components/viewer/DocumentViewerHost'
import { asset } from './data/asset'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={`/asset/${asset.id}`} replace />} />
        {/* Gemeinsames Layout, damit die Karte beim Öffnen und Schliessen des Panels erhalten bleibt */}
        <Route element={<MapPage />}>
          <Route path="/map" element={null} />
          <Route path="/asset/:assetId" element={null} />
        </Route>
        <Route path="/asset/:assetId/edit" element={<Navigate to="files" replace />} />
        <Route path="/asset/:assetId/edit/:section" element={<EditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DocumentViewerHost />
    </>
  )
}
