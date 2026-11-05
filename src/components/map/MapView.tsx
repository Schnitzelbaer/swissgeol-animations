import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import OlMap from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import { Attribution } from 'ol/control'
import Feature from 'ol/Feature'
import type { Coordinate } from 'ol/coordinate'
import type { StyleFunction } from 'ol/style/Style'
import { MapControls, type Basemap } from './MapControls'
import styles from './MapView.module.css'

/*
 * Das Kartenbild in Figma ist ein Retina-Screenshot: Die Landeskarte erscheint dort in halber Grösse.
 * Mit 128px-Kacheln wird jede 256px-Kachel von swisstopo halb so gross gezeichnet, was diesem Bild entspricht.
 */
function swisstopoLayer(layer: string, opacity: number) {
  return new TileLayer({
    opacity,
    source: new XYZ({
      url: `https://wmts.geo.admin.ch/1.0.0/${layer}/default/current/3857/{z}/{x}/{y}.jpeg`,
      attributions: '© swisstopo',
      tileSize: 128,
      maxZoom: 18,
      crossOrigin: 'anonymous',
    }),
  })
}

function tween(from: number, to: number, duration: number, onUpdate: (value: number) => void) {
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3)
    onUpdate(from + (to - from) * eased)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

type Props = {
  /** Objekte der Karte; wird einmal beim Aufbau aufgerufen */
  createFeatures: () => Feature[]
  style: StyleFunction
  center: Coordinate
  resolution: number
  /** Overlay oben links, z.B. die Legende */
  legend?: ReactNode
  /** Breite des Preview-Panels, das rechts über der Karte liegt */
  panelOffset?: number
  /** Gewähltes Objekt, pink hervorgehoben */
  selectedId?: string
  onFeatureClick?: (id: string, feature: Feature) => void
  /** Eingebettete Karte (Detailseite): ohne Tabellenleiste darunter */
  embedded?: boolean
}

export function MapView({ createFeatures, style, center, resolution, legend, panelOffset = 0, selectedId, onFeatureClick, embedded }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<OlMap | null>(null)
  const sourceRef = useRef<VectorSource | null>(null)
  const colorLayerRef = useRef<TileLayer | null>(null)
  const onFeatureClickRef = useRef(onFeatureClick)
  const initialRef = useRef({ createFeatures, style, center, resolution, panelOffset })
  // Standard ist die farbige Landeskarte; die graue liegt darunter und erscheint beim Umschalten
  const [basemap, setBasemap] = useState<Basemap>('farbe')
  const initialBasemapRef = useRef(basemap)

  useEffect(() => {
    onFeatureClickRef.current = onFeatureClick
  }, [onFeatureClick])

  useEffect(() => {
    const greyLayer = swisstopoLayer('ch.swisstopo.pixelkarte-grau', 1)
    const colorLayer = swisstopoLayer('ch.swisstopo.pixelkarte-farbe', initialBasemapRef.current === 'farbe' ? 1 : 0)
    colorLayerRef.current = colorLayer

    const initial = initialRef.current
    const source = new VectorSource({ features: initial.createFeatures() })
    sourceRef.current = source
    const objectLayer = new VectorLayer({ source, style: initial.style })

    const map = new OlMap({
      target: containerRef.current!,
      layers: [greyLayer, colorLayer, objectLayer],
      controls: [new Attribution({ collapsible: false, className: `ol-attribution ${styles.attribution}` })],
      view: new View({
        center: initial.center,
        resolution: initial.resolution,
        padding: [0, initial.panelOffset, 0, 0],
        maxZoom: 19,
        minZoom: 7,
      }),
    })
    mapRef.current = map

    const featureAt = (pixel: number[]) => {
      const hit = map.forEachFeatureAtPixel(pixel, (f) => f, { hitTolerance: 4 })
      return hit instanceof Feature ? hit : null
    }

    let hovered: Feature | null = null
    map.on('pointermove', (event) => {
      if (event.dragging) return
      const feature = featureAt(event.pixel)
      if (feature === hovered) return
      hovered?.set('hover', false)
      feature?.set('hover', true)
      hovered = feature
      containerRef.current!.style.cursor = feature && onFeatureClickRef.current ? 'pointer' : ''
    })

    map.on('click', (event) => {
      const feature = featureAt(event.pixel)
      if (feature) onFeatureClickRef.current?.(String(feature.getId()), feature)
    })

    const resizeObserver = new ResizeObserver(() => map.updateSize())
    resizeObserver.observe(containerRef.current!)

    return () => {
      resizeObserver.disconnect()
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [])

  // Gewähltes Objekt hervorheben
  useEffect(() => {
    for (const feature of sourceRef.current?.getFeatures() ?? []) {
      feature.set('selected', feature.getId() === selectedId)
    }
  }, [selectedId])

  // Das Panel überdeckt die Karte: Padding hält den sichtbaren Kartenmittelpunkt links davon.
  useEffect(() => {
    const view = mapRef.current?.getView()
    if (view) view.padding = [0, panelOffset, 0, 0]
  }, [panelOffset])

  const zoomBy = (delta: number) => {
    const view = mapRef.current?.getView()
    if (!view) return
    view.animate({ zoom: view.getZoom()! + delta, duration: 250 })
  }

  const resetView = () => {
    mapRef.current?.getView().animate({ center, resolution, duration: 600 })
  }

  const toggleBasemap = () => {
    const next = basemap === 'grau' ? 'farbe' : 'grau'
    setBasemap(next)
    const layer = colorLayerRef.current
    if (layer) tween(layer.getOpacity(), next === 'farbe' ? 1 : 0, 350, (value) => layer.setOpacity(value))
  }

  return (
    <div className={`${styles.root} ${embedded ? styles.embedded : ''}`} style={embedded ? ({ '--panel-offset': '0px' } as CSSProperties) : undefined}>
      <div ref={containerRef} className={styles.map} />
      {legend}
      <MapControls
        basemap={basemap}
        onZoomIn={() => zoomBy(1)}
        onZoomOut={() => zoomBy(-1)}
        onReset={resetView}
        onToggleBasemap={toggleBasemap}
      />
    </div>
  )
}
