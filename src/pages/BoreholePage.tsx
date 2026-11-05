import type { ReactNode } from 'react'
import { Navigate, Link, useNavigate, useParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import { MapView } from '../components/map/MapView'
import { boreholeStyle } from '../components/map/boreholeStyles'
import { BOREHOLES_RESOLUTION, boreholeCoordinate, boreholeLonLat, createBoreholeFeatures } from '../components/map/boreholeGeometries'
import { formatSwissNumber, getBorehole, nearestPlace, stableOffset, wgs84ToLv95, type Borehole } from '../data/boreholes'
import { useI18n } from '../i18n'
import styles from './BoreholePage.module.css'
import backIcon from '../assets/icons/back.svg'
import exportIcon from '../assets/icons/header-export.svg'
import editIcon from '../assets/icons/edit.svg'

const SECTIONS = ['location', 'borehole', 'identifiers', 'stratigraphy', 'completion', 'hydrogeology', 'log', 'attachments', 'status'] as const
type SectionId = (typeof SECTIONS)[number]

/** Nur lesendes Feld («form / input / text v2»): Label über einem 44px-Rahmen */
function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      <span className={`${styles.label} body3-medium ellipsis`}>{label}</span>
      <span className={`${styles.value} ellipsis`}>{value}</span>
    </div>
  )
}

/** Karte mit grauem Titelbalken («formularfelder» mit Titel, z.B. «Koordinaten») */
function Card({ title, spacious, children }: { title: string; spacious?: boolean; children: ReactNode }) {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div className={`${styles.cardBody} ${spacious ? styles.cardBodySpacious : ''}`}>{children}</div>
    </section>
  )
}

function Location({ borehole }: { borehole: Borehole }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [lon, lat] = boreholeLonLat(borehole.id)
  const { east, north } = wgs84ToLv95(lon, lat)
  const place = nearestPlace(lon, lat)
  const ground = place.elevation + stableOffset(borehole.id, 12)
  const elevationPrecision = borehole.locationPrecision <= 1 ? 0.1 : 0.5
  const precision = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1))

  return (
    <div className={styles.stack}>
      <div className={styles.panel}>
        <Card title={t.boreholes.coordinates}>
          <Field label={t.boreholes.spatialReferenceSystem} value={t.boreholes.spatialReferenceValue} />
          <div className={styles.row}>
            <Field label={t.boreholes.eastLv95} value={formatSwissNumber(east)} />
            <Field label={t.boreholes.eastLv03} value={formatSwissNumber(east - 2000000)} />
          </div>
          <div className={styles.row}>
            <Field label={t.boreholes.northLv95} value={formatSwissNumber(north)} />
            <Field label={t.boreholes.northLv03} value={formatSwissNumber(north - 1000000)} />
          </div>
        </Card>
        <Field label={t.boreholes.locationPrecision} value={precision(borehole.locationPrecision)} />
        <div className={styles.row}>
          <Field label={t.boreholes.groundElevation} value={formatSwissNumber(ground, 1)} />
          <Field label={t.boreholes.groundElevationPrecision} value={precision(elevationPrecision)} />
        </div>
        <div className={styles.row}>
          <Field label={t.boreholes.referenceElevation} value={formatSwissNumber(ground + borehole.referenceOffset, 1)} />
          <Field label={t.boreholes.referenceElevationPrecision} value={precision(elevationPrecision)} />
        </div>
        <div className={styles.row}>
          <Field label={t.boreholes.referenceElevationType} value={t.boreholes.referenceElevationTypeValue} />
          <Field label={t.boreholes.heightReferenceSystem} value="LN02" />
        </div>
        {/* Kartenausschnitt um die Bohrung; key: beim Wechsel der Bohrung neu zentrieren */}
        <div className={styles.map}>
          <MapView
            key={borehole.id}
            createFeatures={createBoreholeFeatures}
            style={boreholeStyle}
            center={boreholeCoordinate(borehole.id)}
            resolution={BOREHOLES_RESOLUTION}
            selectedId={borehole.id}
            onFeatureClick={(id) => navigate(`/boreholes/${id}/location`)}
            embedded
          />
        </div>
      </div>
      <div className={`${styles.panel} ${styles.row}`}>
        <Field label={t.boreholes.country} value={t.boreholes.countryValue} />
        <Field label={t.boreholes.canton} value={t.boreholes.cantonValue} />
        <Field label={t.boreholes.municipality} value={place.name} />
      </div>
    </div>
  )
}

function Identifiers({ borehole }: { borehole: Borehole }) {
  const { lang, t } = useI18n()
  return (
    <Card title={t.boreholes.identifiers} spacious>
      {borehole.identifiers.map((identifier) => (
        <div key={identifier.type} className={styles.identifier}>
          <Field label={t.boreholes.idType} value={identifier.type} className={styles.idType} />
          <div className={styles.codes}>
            {identifier.codes.map((entry) => (
              <div key={entry.code} className={styles.row}>
                <Field label={t.boreholes.idCode} value={entry.code} className={entry.comment ? styles.idCode : undefined} />
                {entry.comment && <Field label={t.boreholes.comment} value={entry.comment[lang]} />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Card>
  )
}

/**
 * Detailseite einer Bohrung (Figma «Detail-Pages»: Standort 7568:60709, ID's 18334:115379).
 * Route /boreholes/:boreholeId/:section; nur Standort und ID's sind ausgebaut.
 */
export function BoreholePage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { boreholeId, section } = useParams()
  const borehole = getBorehole(boreholeId)
  if (!borehole) return <Navigate to="/boreholes" replace />
  const active = (SECTIONS as readonly string[]).includes(section ?? '') ? (section as SectionId) : 'location'

  return (
    <div className={styles.page}>
      <Header app="boreholes" />

      <div className={styles.detailHeader}>
        <div className={styles.detailTitle}>
          <Button variant="primary" icon={backIcon} aria-label={t.boreholes.backToMap} tooltip={t.boreholes.back} onClick={() => navigate('/boreholes')} />
          <h1 className={styles.title}>{borehole.name}</h1>
          <span className={styles.chips}>
            <span className={`${styles.chip} ${styles.draft}`}>{t.boreholes.status}</span>
            <span className={`${styles.chip} ${styles.assignee}`}>Matthias Walder</span>
          </span>
        </div>
        <div className={styles.detailActions}>
          <Button variant="secondary" label={t.boreholes.export} icon={exportIcon} iconPosition="right" />
          <Button variant="primary" label={t.boreholes.edit} icon={editIcon} iconPosition="right" />
        </div>
      </div>

      <div className={styles.body}>
        <nav className={styles.nav} aria-label={t.boreholes.sectionsLabel}>
          {SECTIONS.map((id) => (
            <Link
              key={id}
              to={`/boreholes/${borehole.id}/${id}`}
              className={`${styles.navItem} ${id === active ? styles.navActive : ''}`}
              aria-current={id === active ? 'page' : undefined}
            >
              <span className="ellipsis">{t.boreholes.sections[id]}</span>
            </Link>
          ))}
        </nav>

        <main className={styles.main}>
          <div className={styles.content}>
            {active === 'location' ? (
              <Location borehole={borehole} />
            ) : active === 'identifiers' ? (
              <Identifiers borehole={borehole} />
            ) : (
              <p className={styles.placeholder}>{t.boreholes.notBuilt}</p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
