import { useEffect, useRef } from 'react'
import { SYMBOLS } from './boreholeSymbols'
import { drawSymbol } from './boreholeStyles'

/** Bohrungs-Symbol (30×30) für Legende und Popover, mit derselben Zeichenfunktion wie auf der Karte */
export function SymbolIcon({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const definition = SYMBOLS[symbol]
    if (!canvas || !definition) return
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = 30 * ratio
    canvas.height = 30 * ratio
    const context = canvas.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    drawSymbol(context, definition, 15 * ratio, 15 * ratio, ratio)
  }, [symbol])

  return <canvas ref={ref} width={30} height={30} style={{ width: 30, height: 30, flexShrink: 0 }} aria-hidden />
}
