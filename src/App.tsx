import { Navigate, Route, Routes } from 'react-router-dom'
import { MapPage } from './pages/MapPage'
import { EditPage } from './pages/EditPage'
import { BoreholesMapPage } from './pages/BoreholesMapPage'
import { BoreholePage } from './pages/BoreholePage'
import { DocumentViewerHost } from './components/viewer/DocumentViewerHost'
import { DEFAULT_ASSET_ID } from './data/assets'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={`/asset/${DEFAULT_ASSET_ID}`} replace />} />
        {/* Gemeinsames Layout, damit die Karte beim Öffnen und Schliessen des Panels erhalten bleibt */}
        <Route element={<MapPage />}>
          <Route path="/map" element={null} />
          <Route path="/asset/:assetId" element={null} />
        </Route>
        <Route path="/asset/:assetId/edit" element={<Navigate to="files" replace />} />
        <Route path="/asset/:assetId/edit/:section" element={<EditPage />} />
        <Route path="/boreholes" element={<BoreholesMapPage />} />
        <Route path="/boreholes/:boreholeId" element={<Navigate to="location" replace />} />
        <Route path="/boreholes/:boreholeId/:section" element={<BoreholePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DocumentViewerHost />
    </>
  )
}
