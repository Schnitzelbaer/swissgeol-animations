import { useEffect, useRef, useState } from 'react'
import OlMap from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import { Attribution } from 'ol/control'
import Feature from 'ol/Feature'
import { createAssetFeatures, INITIAL_CENTER, INITIAL_RESOLUTION } from './geometries'
import { assetStyle } from './styles'
import { Legend } from './Legend'
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
  /** Breite des Preview-Panels, das rechts über der Karte liegt */
  panelOffset: number
  onAssetClick: (assetId: string) => void
}

export function MapView({ panelOffset, onAssetClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<OlMap | null>(null)
  const colorLayerRef = useRef<TileLayer | null>(null)
  const onAssetClickRef = useRef(onAssetClick)
  const initialPaddingRef = useRef(panelOffset)
  const [basemap, setBasemap] = useState<Basemap>('grau')

  useEffect(() => {
    onAssetClickRef.current = onAssetClick
  }, [onAssetClick])

  useEffect(() => {
    const greyLayer = swisstopoLayer('ch.swisstopo.pixelkarte-grau', 1)
    const colorLayer = swisstopoLayer('ch.swisstopo.pixelkarte-farbe', 0)
    colorLayerRef.current = colorLayer

    const assetLayer = new VectorLayer({
      source: new VectorSource({ features: createAssetFeatures() }),
      style: assetStyle,
    })

    const map = new OlMap({
      target: containerRef.current!,
      layers: [greyLayer, colorLayer, assetLayer],
      controls: [new Attribution({ collapsible: false, className: `ol-attribution ${styles.attribution}` })],
      view: new View({
        center: INITIAL_CENTER,
        resolution: INITIAL_RESOLUTION,
        padding: [0, initialPaddingRef.current, 0, 0],
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
      containerRef.current!.style.cursor = feature ? 'pointer' : ''
    })

    map.on('click', (event) => {
      const feature = featureAt(event.pixel)
      if (feature) onAssetClickRef.current(feature.get('assetId'))
    })

    const resizeObserver = new ResizeObserver(() => map.updateSize())
    resizeObserver.observe(containerRef.current!)

    return () => {
      resizeObserver.disconnect()
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [])

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
    mapRef.current?.getView().animate({ center: INITIAL_CENTER, resolution: INITIAL_RESOLUTION, duration: 600 })
  }

  const toggleBasemap = () => {
    const next = basemap === 'grau' ? 'farbe' : 'grau'
    setBasemap(next)
    const layer = colorLayerRef.current
    if (layer) tween(layer.getOpacity(), next === 'farbe' ? 1 : 0, 350, (value) => layer.setOpacity(value))
  }

  return (
    <div className={styles.root}>
      <div ref={containerRef} className={styles.map} />
      <Legend />
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
