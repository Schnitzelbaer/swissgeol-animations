import { useCallback, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { TableBar } from '../components/TableBar'
import { MapView } from '../components/map/MapView'
import { Legend } from '../components/map/Legend'
import { boreholeStyle } from '../components/map/boreholeStyles'
import { BOREHOLES_CENTER, BOREHOLES_RESOLUTION, createBoreholeFeatures } from '../components/map/boreholeGeometries'
import { useI18n } from '../i18n'
import styles from './MapPage.module.css'
import legendGeneral from '../assets/map/legend-borehole-general.svg'
import legendGeothermal from '../assets/map/legend-borehole-geothermal.svg'
import legendGeotechnics from '../assets/map/legend-borehole-geotechnics.svg'
import legendHydrogeology from '../assets/map/legend-borehole-hydrogeology.svg'

/** Anzahl Bohrungen wie im Figma-Screen */
const BOREHOLE_COUNT = 23000

/**
 * Startseite der Applikation Boreholes (Figma 7558:31771): Karte mit Bohrungen nach Template-Typ.
 * Ein Klick auf eine Bohrung öffnet direkt ihre Detailseite, ohne Panel dazwischen.
 */
export function BoreholesMapPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const openBorehole = useCallback((id: string) => navigate(`/boreholes/${id}/location`), [navigate])

  return (
    <div className={styles.app}>
      <Header app="boreholes" />
      <div className={styles.body}>
        <Sidebar app="boreholes" />
        <main className={styles.main} style={{ '--panel-offset': '0px' } as CSSProperties}>
          <MapView
            createFeatures={createBoreholeFeatures}
            style={boreholeStyle}
            center={BOREHOLES_CENTER}
            resolution={BOREHOLES_RESOLUTION}
            legend={
              <Legend
                title={t.boreholes.legendTitle}
                width={212}
                items={[
                  { icon: legendGeneral, label: t.boreholes.templateType.general },
                  { icon: legendGeothermal, label: t.boreholes.templateType.geothermal },
                  { icon: legendGeotechnics, label: t.boreholes.templateType.geotechnics },
                  { icon: legendHydrogeology, label: t.boreholes.templateType.hydrogeology },
                ]}
              />
            }
            onFeatureClick={openBorehole}
          />
          <TableBar count={t.boreholes.count(BOREHOLE_COUNT)} />
        </main>
      </div>
    </div>
  )
}
