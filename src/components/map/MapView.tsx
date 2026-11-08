import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import OlMap from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import HeatmapLayer from 'ol/layer/Heatmap'
import VectorSource from 'ol/source/Vector'
import Cluster from 'ol/source/Cluster'
import { boundingExtent, containsExtent, createEmpty, extend, getCenter } from 'ol/extent'
import XYZ from 'ol/source/XYZ'
import { Attribution } from 'ol/control'
import Feature from 'ol/Feature'
import Overlay from 'ol/Overlay'
import Point from 'ol/geom/Point'
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

export type StackedControls = {
  close: () => void
  /** Hebt eine Bohrung aus dem Popover hervor; ohne ID wieder alle */
  highlight: (id: string | null) => void
}

type Props = {
  /** Objekte der Karte; wird einmal beim Aufbau aufgerufen */
  createFeatures: () => Feature[]
  /** Stil; ein neuer Stil (z.B. andere Legende) zeichnet die Objekte neu */
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
  /**
   * Dicht liegende Objekte (Boreholes): Hover hebt alle getroffenen Objekte hervor und zeigt einen Tooltip;
   * ein Klick auf mehrere öffnet ein Popover, ein Klick auf eines ruft onFeatureClick auf.
   */
  stacked?: {
    tooltip: (ids: string[]) => ReactNode
    popover: (ids: string[], controls: StackedControls) => ReactNode
  }
  /**
   * Ab dieser Auflösung (m/px, also weiter herausgezoomt) nur noch Badges: nahe Objekte werden zusammengefasst,
   * damit die Karte performant bleibt. Ein Klick auf ein Badge zoomt hinein.
   */
  clusters?: { resolution: number; distance: number; style: StyleFunction; halfHeight: number }
  /**
   * Ab dieser Auflösung (m/px, also weiter herausgezoomt) eine Heatmap statt der Objekte (Assets).
   * Die Punkte kommen aus `createPoints` (Feature mit Punkt und Eigenschaft `weight`).
   */
  heatmap?: { resolution: number; createPoints: () => Feature[] }
  /** Eingebettete Karte (Detailseite): ohne Tabellenleiste darunter */
  embedded?: boolean
}

/** Farbverlauf der Heatmap wie in der Live-App: Cyan am Rand über Grün und Gelb zu Rot */
const HEATMAP_GRADIENT = ['rgba(56, 189, 248, 0)', 'rgba(94, 234, 212, 0.75)', '#4ade80', '#a3e635', '#fde047', '#fb923c', '#ef4444']

/** Anker über den getroffenen Objekten: mittig, auf Höhe des obersten */
function anchorOf(features: Feature[]): Coordinate {
  const points = features.map((feature) => (feature.getGeometry() as Point).getCoordinates())
  const x = points.reduce((sum, point) => sum + point[0], 0) / points.length
  const y = Math.max(...points.map((point) => point[1]))
  return [x, y]
}

/** Abstand von Tooltip und Popover zum Anker: halbe Höhe des grössten Objekts (Symbol 8px, Badge mehr) plus Luft */
function offsetOf(features: Feature[], gap: number): [number, number] {
  const halfHeight = Math.max(8, ...features.map((feature) => (feature.get('halfHeight') as number | undefined) ?? 8))
  return [0, -(halfHeight + gap)]
}

export function MapView({ createFeatures, style, center, resolution, legend, panelOffset = 0, selectedId, onFeatureClick, stacked, clusters, heatmap, embedded }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<OlMap | null>(null)
  const sourceRef = useRef<VectorSource | null>(null)
  const objectLayerRef = useRef<VectorLayer | null>(null)
  const colorLayerRef = useRef<TileLayer | null>(null)
  const onFeatureClickRef = useRef(onFeatureClick)
  const stackedRef = useRef(stacked)
  const initialRef = useRef({ createFeatures, style, center, resolution, panelOffset, clusters, heatmap })
  // Standard ist die farbige Landeskarte; die graue liegt darunter und erscheint beim Umschalten
  const [basemap, setBasemap] = useState<Basemap>('farbe')
  const initialBasemapRef = useRef(basemap)

  // Tooltip und Popover liegen als OpenLayers-Overlays auf der Karte und wandern beim Verschieben mit
  const [tooltipElement] = useState(() => document.createElement('div'))
  const [popoverElement] = useState(() => document.createElement('div'))
  const [tooltipIds, setTooltipIds] = useState<string[]>([])
  const [popoverIds, setPopoverIds] = useState<string[]>([])
  const popoverIdsRef = useRef<string[]>([])
  const hoveredRef = useRef<Feature[]>([])
  /** Objekte direkt unter dem Zeiger (ohne die übrigen ihrer Gruppe) */
  const hitsRef = useRef<Feature[]>([])
  const tooltipOverlayRef = useRef<Overlay | null>(null)
  const popoverOverlayRef = useRef<Overlay | null>(null)

  useEffect(() => {
    onFeatureClickRef.current = onFeatureClick
    stackedRef.current = stacked
  }, [onFeatureClick, stacked])

  // Zusammengehörige Objekte (Feature-Eigenschaft `group`, bei Assets die Asset-ID) werden gemeinsam markiert
  const groupsRef = useRef(new Map<string, Feature[]>())
  const withGroups = useCallback((features: Feature[]) => {
    const result: Feature[] = []
    for (const feature of features) {
      const group = feature.get('group') as string | undefined
      for (const member of (group && groupsRef.current.get(group)) || [feature]) if (!result.includes(member)) result.push(member)
    }
    return result
  }, [])

  const setHovered = useCallback(
    (hits: Feature[]) => {
      const features = withGroups(hits)
      for (const feature of hoveredRef.current) if (!features.includes(feature)) feature.set('hover', false)
      for (const feature of features) feature.set('hover', true)
      hoveredRef.current = features
      hitsRef.current = hits
    },
    [withGroups],
  )

  const closePopover = useCallback(() => {
    popoverIdsRef.current = []
    setPopoverIds([])
    popoverOverlayRef.current?.setPosition(undefined)
    setHovered([])
  }, [setHovered])

  useEffect(() => {
    const greyLayer = swisstopoLayer('ch.swisstopo.pixelkarte-grau', 1)
    const colorLayer = swisstopoLayer('ch.swisstopo.pixelkarte-farbe', initialBasemapRef.current === 'farbe' ? 1 : 0)
    colorLayerRef.current = colorLayer

    const initial = initialRef.current
    const source = new VectorSource({ features: initial.createFeatures() })
    sourceRef.current = source
    groupsRef.current = new Map()
    for (const feature of source.getFeatures()) {
      const group = feature.get('group') as string | undefined
      if (group) groupsRef.current.set(group, [...(groupsRef.current.get(group) ?? []), feature])
    }
    const objectLayer = new VectorLayer({ source, style: initial.style })
    objectLayerRef.current = objectLayer

    // Herausgezoomt: Cluster-Layer mit Badges statt der einzelnen Objekte
    const clusterOptions = initial.clusters
    const clusterLayers: (VectorLayer | HeatmapLayer)[] = []
    if (clusterOptions) {
      objectLayer.setMaxResolution(clusterOptions.resolution)
      const clusterSource = new Cluster({
        source,
        distance: clusterOptions.distance,
        minDistance: Math.min(clusterOptions.distance, 40),
        createCluster: (point, features) => new Feature({ geometry: point, features, halfHeight: clusterOptions.halfHeight }),
      })
      clusterLayers.push(new VectorLayer({ source: clusterSource, style: clusterOptions.style, minResolution: clusterOptions.resolution }))
    }

    // Herausgezoomt: Heatmap statt der Objekte. Radius und Unschärfe wachsen beim Hineinzoomen mit (rund 3 km im Gelände),
    // damit das Bild über die Zoomstufen gleich wirkt.
    const heatmapOptions = initial.heatmap
    if (heatmapOptions) {
      objectLayer.setMaxResolution(heatmapOptions.resolution)
      clusterLayers.push(
        new HeatmapLayer({
          source: new VectorSource({ features: heatmapOptions.createPoints() }),
          minResolution: heatmapOptions.resolution,
          weight: 'weight',
          radius: ['clamp', ['/', 2600, ['resolution']], 5, 40],
          blur: ['clamp', ['/', 4200, ['resolution']], 9, 64],
          gradient: HEATMAP_GRADIENT,
          opacity: 0.7,
        }),
      )
    }

    const tooltipOverlay = new Overlay({ element: tooltipElement, positioning: 'bottom-center', stopEvent: false })
    const popoverOverlay = new Overlay({ element: popoverElement, positioning: 'bottom-center', autoPan: { animation: { duration: 250 }, margin: 24 } })
    tooltipOverlayRef.current = tooltipOverlay
    popoverOverlayRef.current = popoverOverlay

    const map = new OlMap({
      target: containerRef.current!,
      layers: [greyLayer, colorLayer, objectLayer, ...clusterLayers],
      overlays: [tooltipOverlay, popoverOverlay],
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

    // Alle Objekte unter dem Zeiger (oberstes zuerst); ohne stacked nur das oberste.
    // Mit stacked ohne Toleranz: getroffen ist nur, was wirklich unter dem Zeiger liegt, nicht schon die Nachbarn.
    const featuresAt = (pixel: number[]) => {
      const hits: Feature[] = []
      map.forEachFeatureAtPixel(
        pixel,
        (feature) => {
          if (feature instanceof Feature && !hits.includes(feature)) hits.push(feature)
          return stackedRef.current ? undefined : true
        },
        { hitTolerance: stackedRef.current ? 0 : 4, layerFilter: (layer) => !(layer instanceof HeatmapLayer) },
      )
      return hits
    }

    /** IDs der getroffenen Objekte; ein Cluster steht für alle seine Objekte */
    const idsOf = (features: Feature[]) =>
      features.flatMap((feature) => {
        const members = feature.get('features') as Feature[] | undefined
        return members ? members.map((member) => String(member.getId())) : [String(feature.getId())]
      })

    /** Klick auf ein Badge: auf seine Objekte zoomen, mindestens so weit, dass sie einzeln erscheinen */
    const zoomInto = (members: Feature[]) => {
      const view = map.getView()
      const extent = boundingExtent(members.map((member) => (member.getGeometry() as Point).getCoordinates()))
      const [width, height] = map.getSize() ?? [800, 600]
      const fit = view.getResolutionForExtent(extent, [Math.max(200, width - 240), Math.max(200, height - 240)])
      const limit = clusterOptions!.resolution
      const target = Math.min(limit * 0.83, Math.max(limit / 8, fit || 0))
      view.animate({ center: getCenter(extent), resolution: target, duration: 500 })
    }

    const showTooltip = (features: Feature[]) => {
      if (!stackedRef.current || features.length === 0) {
        tooltipOverlay.setPosition(undefined)
        setTooltipIds([])
        return
      }
      setTooltipIds(idsOf(features))
      tooltipOverlay.setOffset(offsetOf(features, 8))
      tooltipOverlay.setPosition(anchorOf(features))
    }

    map.on('pointermove', (event) => {
      if (event.dragging) return
      const hits = featuresAt(event.pixel)
      containerRef.current!.style.cursor = hits.length && onFeatureClickRef.current ? 'pointer' : ''
      // Offenes Popover: seine Bohrungen bleiben hervorgehoben, kein Tooltip
      if (popoverIdsRef.current.length) return
      const same = hits.length === hitsRef.current.length && hits.every((feature) => hitsRef.current.includes(feature))
      if (same) return
      setHovered(hits)
      showTooltip(hits)
    })

    containerRef.current!.addEventListener('mouseleave', () => {
      if (popoverIdsRef.current.length) return
      setHovered([])
      showTooltip([])
    })

    // Beim Zoomen bilden sich die Badges neu: Hover und Tooltip zurücksetzen, Popover schliessen, sobald nur noch Badges da sind
    map.on('movestart', () => {
      if (popoverIdsRef.current.length) return
      setHovered([])
      showTooltip([])
    })
    map.on('moveend', () => {
      const resolution = map.getView().getResolution() ?? 0
      if (clusterOptions && popoverIdsRef.current.length && resolution >= clusterOptions.resolution) closePopover()
    })

    map.on('click', (event) => {
      const hits = featuresAt(event.pixel)
      const cluster = hits.find((feature) => feature.get('features'))
      if (cluster) {
        if (popoverIdsRef.current.length) closePopover()
        showTooltip([])
        zoomInto(cluster.get('features') as Feature[])
        return
      }
      if (hits.length > 1 && stackedRef.current) {
        const ids = hits.map((feature) => String(feature.getId()))
        popoverIdsRef.current = ids
        setPopoverIds(ids)
        setHovered(hits)
        showTooltip([])
        popoverOverlay.setOffset(offsetOf(hits, 10))
        popoverOverlay.setPosition(anchorOf(hits))
        return
      }
      if (popoverIdsRef.current.length) closePopover()
      if (hits.length) onFeatureClickRef.current?.(String(hits[0].getId()), hits[0])
    })

    const resizeObserver = new ResizeObserver(() => map.updateSize())
    resizeObserver.observe(containerRef.current!)

    return () => {
      resizeObserver.disconnect()
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [tooltipElement, popoverElement, setHovered, closePopover])

  // Anderer Stil, z.B. nach dem Wechsel der Legende
  useEffect(() => {
    objectLayerRef.current?.setStyle(style)
  }, [style])

  // Das Popover hat erst nach dem Rendern seine Grösse: dann die Karte so verschieben, dass es ganz sichtbar ist
  useEffect(() => {
    if (!popoverIds.length) return
    const frame = requestAnimationFrame(() => popoverOverlayRef.current?.panIntoView({ animation: { duration: 250 }, margin: 24 }))
    return () => cancelAnimationFrame(frame)
  }, [popoverIds])

  // Escape schliesst das Popover
  useEffect(() => {
    if (!popoverIds.length) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      closePopover()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [popoverIds, closePopover])

  const highlight = useCallback(
    (id: string | null) => {
      const features = (sourceRef.current?.getFeatures() ?? []).filter((feature) => (id ? feature.getId() === id : popoverIdsRef.current.includes(String(feature.getId()))))
      setHovered(features)
    },
    [setHovered],
  )

  // Gewähltes Objekt samt seiner Gruppe hervorheben; liegt es ausserhalb des sichtbaren Ausschnitts, dorthin fahren
  const firstSelectionRef = useRef(true)
  useEffect(() => {
    const features = sourceRef.current?.getFeatures() ?? []
    const chosen = features.find((feature) => feature.getId() === selectedId)
    const selected = chosen ? withGroups([chosen]) : []
    for (const feature of features) feature.set('selected', selected.includes(feature))

    const map = mapRef.current
    const first = firstSelectionRef.current
    firstSelectionRef.current = false
    if (!map || !selected.length) return
    const extent = createEmpty()
    for (const feature of selected) extend(extent, feature.getGeometry()!.getExtent())
    const fit = () => {
      const view = map.getView()
      const visible = view.calculateExtent()
      if (containsExtent(visible, extent)) return
      // fit() rechnet das View-Padding (Panel) schon ein, hier nur der Rand
      view.fit(extent, {
        padding: [120, 120, 120, 120],
        maxZoom: 15,
        duration: first ? 0 : 600,
      })
    }
    // Beim ersten Aufruf hat die Karte noch nicht gerendert und kennt ihre Grösse nicht: nach dem ersten Bild einpassen
    if (first) map.once('postrender', fit)
    else fit()
  }, [selectedId, withGroups])

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
      {stacked &&
        tooltipIds.length > 0 &&
        createPortal(
          <div className={styles.tooltip} role="tooltip">
            {stacked.tooltip(tooltipIds)}
          </div>,
          tooltipElement,
        )}
      {stacked && popoverIds.length > 0 && createPortal(stacked.popover(popoverIds, { close: closePopover, highlight }), popoverElement)}
    </div>
  )
}
