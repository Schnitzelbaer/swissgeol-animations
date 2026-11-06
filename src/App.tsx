import { Navigate, Route, Routes } from 'react-router-dom'
import { MapPage } from './pages/MapPage'
import { EditPage } from './pages/EditPage'
import { BoreholesMapPage } from './pages/BoreholesMapPage'
import { BoreholePage } from './pages/BoreholePage'
import { DocumentViewerHost } from './components/viewer/DocumentViewerHost'
import { AiAnalysisPage } from './animation/AiAnalysisPage'

export default function App() {
  return (
    <>
      <Routes>
        {/* Branch animation-ai-analysis: Der Preview-Link öffnet direkt die Animation */}
        <Route path="/" element={<Navigate to="/animation/ai-analysis" replace />} />
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
        {/* Isolierte Animation, unabhängig vom übrigen Prototyp */}
        <Route path="/animation/ai-analysis" element={<AiAnalysisPage />} />
        <Route path="/animation" element={<Navigate to="/animation/ai-analysis" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DocumentViewerHost />
    </>
  )
}
