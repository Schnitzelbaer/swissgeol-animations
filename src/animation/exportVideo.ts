import { createContext, destroyContext, domToCanvas } from 'modern-screenshot'
import { ArrayBufferTarget as Mp4Target, Muxer as Mp4Muxer } from 'mp4-muxer'
import { ArrayBufferTarget as WebmTarget, Muxer as WebmMuxer } from 'webm-muxer'

/*
 * Video-Export im Browser: Die Animation wird Bild für Bild gerendert (Zeit setzen, DOM rastern),
 * mit WebCodecs kodiert und als MP4 (H.264) oder, wo H.264 fehlt, als WebM (VP9) verpackt.
 * Weil jedes Bild aus der Zeit berechnet wird, ist das Video unabhängig vom Tempo des Rechners flüssig.
 */

export type ExportOptions = {
  /** Element in Canvas-Grösse, das gerastert wird */
  node: HTMLElement
  width: number
  height: number
  fps: number
  /** Bitrate in Bit/s */
  bitrate: number
  from: number
  to: number
  /** Setzt die Zeit und rendert synchron (flushSync) */
  renderAt: (time: number) => void
  onProgress: (done: number, total: number) => void
  signal: AbortSignal
}

export type ExportResult = { blob: Blob; extension: 'mp4' | 'webm' }

type Codec = { kind: 'mp4' | 'webm'; config: VideoEncoderConfig }

/** Erst H.264 (MP4), sonst VP9 (WebM) – je nachdem, was der Browser kodieren kann */
async function pickCodec(width: number, height: number, fps: number, bitrate: number): Promise<Codec> {
  if (typeof VideoEncoder === 'undefined') throw new Error('Dieser Browser kann keine Videos kodieren (WebCodecs fehlt). Bitte Chrome, Edge oder Safari verwenden.')
  const base = { width, height, bitrate, framerate: fps }
  const candidates: Codec[] = [
    { kind: 'mp4', config: { ...base, codec: 'avc1.640034', avc: { format: 'avc' } } },
    { kind: 'mp4', config: { ...base, codec: 'avc1.4d0034', avc: { format: 'avc' } } },
    { kind: 'mp4', config: { ...base, codec: 'avc1.42003e', avc: { format: 'avc' } } },
    { kind: 'webm', config: { ...base, codec: 'vp09.00.51.08' } },
    { kind: 'webm', config: { ...base, codec: 'vp8' } },
  ]
  for (const candidate of candidates) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported(candidate.config)
      if (supported) return candidate
    } catch {
      // nächste Variante
    }
  }
  throw new Error(`Keine passende Videokodierung für ${width}×${height} gefunden.`)
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

export async function exportVideo(options: ExportOptions): Promise<ExportResult> {
  // H.264 verlangt gerade Abmessungen
  const width = Math.max(2, Math.round(options.width / 2) * 2)
  const height = Math.max(2, Math.round(options.height / 2) * 2)
  const { fps, bitrate, from, to, renderAt, onProgress, signal, node } = options
  const codec = await pickCodec(width, height, fps, bitrate)

  const mp4 = codec.kind === 'mp4' ? new Mp4Muxer({ target: new Mp4Target(), video: { codec: 'avc', width, height, frameRate: fps }, fastStart: 'in-memory' }) : null
  const webm =
    codec.kind === 'webm'
      ? new WebmMuxer({ target: new WebmTarget(), video: { codec: codec.config.codec.startsWith('vp09') ? 'V_VP9' : 'V_VP8', width, height, frameRate: fps } })
      : null

  let encoderError: Error | null = null
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      if (mp4) mp4.addVideoChunk(chunk, meta)
      else webm!.addVideoChunk(chunk, meta)
    },
    error: (error) => {
      encoderError = error instanceof Error ? error : new Error(String(error))
    },
  })
  encoder.configure(codec.config)

  const frames = Math.max(1, Math.round(((to - from) / 1000) * fps) + 1)
  const frameDuration = 1_000_000 / fps
  // Kontext einmal anlegen: Schriften und Bilder werden nur einmal eingebettet
  const context = await createContext(node, { width, height, scale: 1, backgroundColor: null })
  try {
    for (let index = 0; index < frames; index++) {
      if (signal.aborted) throw new DOMException('Export abgebrochen', 'AbortError')
      if (encoderError) throw encoderError
      renderAt(from + (index * 1000) / fps)
      await nextFrame()
      const canvas = await domToCanvas(context)
      const frame = new VideoFrame(canvas, { timestamp: Math.round(index * frameDuration), duration: Math.round(frameDuration) })
      encoder.encode(frame, { keyFrame: index % (fps * 2) === 0 })
      frame.close()
      // Nicht zu viele Bilder in der Warteschlange des Encoders
      while (encoder.encodeQueueSize > 8) await new Promise((resolve) => setTimeout(resolve, 5))
      onProgress(index + 1, frames)
    }
    await encoder.flush()
    if (encoderError) throw encoderError
  } finally {
    destroyContext(context)
    if (encoder.state !== 'closed') encoder.close()
  }

  if (mp4) {
    mp4.finalize()
    return { blob: new Blob([mp4.target.buffer], { type: 'video/mp4' }), extension: 'mp4' }
  }
  webm!.finalize()
  return { blob: new Blob([webm!.target.buffer], { type: 'video/webm' }), extension: 'webm' }
}
