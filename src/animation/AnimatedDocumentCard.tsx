import type { CSSProperties } from 'react'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { CLASSES_WITHOUT_LANGUAGE, fileLanguages, groupSections, pageRange, sectionTitle, type AssetFile } from '../data/files'
import { useI18n } from '../i18n'
import { alpha, clamp01, cubicBezier, eased, linear, pulse, rowStart, typingDuration, type Config, type TocRow } from './timeline'
import styles from './AnimatedDocumentCard.module.css'
import pdfIcon from '../assets/icons/filetype-pdf.svg'
import downloadIcon from '../assets/icons/download.svg'
import eyeIcon from '../assets/icons/eye.svg'
import chevronRightIcon from '../assets/icons/chevron-right.svg'

/** Zeilen und Chips des Dokuments, wie sie nach der Analyse erscheinen */
export function useDocumentContent(file: AssetFile) {
  const { t } = useI18n()
  const groups = groupSections(file.sections ?? [])
  const chips = groups.map((group) => t.pageClassGroup[group.type])
  const rows: TocRow[] = []
  groups.forEach((group, groupIndex) => {
    rows.push({ kind: 'group', text: t.pageClassGroup[group.type], first: groupIndex === 0 })
    for (const section of group.sections) {
      const language = section.language && !CLASSES_WITHOUT_LANGUAGE.includes(section.type) ? section.language : undefined
      rows.push({ kind: 'entry', text: sectionTitle(section, t.pageClass), language, pages: pageRange(section) })
    }
  })
  return { chips, rows, languages: fileLanguages(file) }
}

/** Text bis zur getippten Länge, optional mit Schreibmarke */
function Typed({ text, chars, cursor }: { text: string; chars: number; cursor: boolean }) {
  return (
    <>
      {text.slice(0, chars)}
      {cursor && <span className={styles.caret} aria-hidden />}
    </>
  )
}

/* AI-Sterne aus dem Figma-Icon «analyse» (ohne Rahmenecken) */
const BIG_STAR =
  'M8.79557 12.0416C8.7435 11.8397 8.63827 11.6555 8.49086 11.5081C8.34344 11.3607 8.15921 11.2555 7.95734 11.2034L4.37869 10.2806C4.31763 10.2632 4.2639 10.2265 4.22563 10.1758C4.18737 10.1252 4.16667 10.0635 4.16667 10C4.16667 9.93653 4.18737 9.8748 4.22563 9.82416C4.2639 9.77353 4.31763 9.73675 4.37869 9.71942L7.95734 8.79603C8.15914 8.744 8.34332 8.63887 8.49073 8.49156C8.63814 8.34425 8.7434 8.16015 8.79557 7.95838L9.71838 4.37972C9.73554 4.31843 9.77227 4.26442 9.82298 4.22596C9.87369 4.18749 9.9356 4.16667 9.99925 4.16667C10.0629 4.16667 10.1248 4.18749 10.1755 4.22596C10.2262 4.26442 10.263 4.31843 10.2801 4.37972L11.2023 7.95838C11.2544 8.16025 11.3596 8.34448 11.5071 8.4919C11.6545 8.63931 11.8387 8.74454 12.0406 8.79662L15.6192 9.71884C15.6808 9.73582 15.735 9.77251 15.7737 9.8233C15.8124 9.87408 15.8333 9.93616 15.8333 10C15.8333 10.0638 15.8124 10.1259 15.7737 10.1767C15.735 10.2275 15.6808 10.2642 15.6192 10.2812L12.0406 11.2034C11.8387 11.2555 11.6545 11.3607 11.5071 11.5081C11.3596 11.6555 11.2544 11.8397 11.2023 12.0416L10.2795 15.6203C10.2624 15.6816 10.2256 15.7356 10.1749 15.774C10.1242 15.8125 10.0623 15.8333 9.99867 15.8333C9.93502 15.8333 9.87311 15.8125 9.8224 15.774C9.77169 15.7356 9.73495 15.6816 9.7178 15.6203L8.79557 12.0416Z'
const SMALL_STARS: [number, number][] = [
  [5.33, 13.5],
  [13.67, 6],
]

function Sparkles({ phase, twinkle }: { phase: number; twinkle: boolean }) {
  // Jeder Stern pulsiert mit eigener Phase
  const pulse = (offset: number) => (twinkle ? 0.5 + 0.5 * Math.sin((phase + offset) * Math.PI * 2) : 1)
  const big = pulse(0)
  return (
    <svg viewBox="2.5 2.5 15 15" width="16" height="16" aria-hidden className={styles.sparkles}>
      <path d={BIG_STAR} fill="#fff" transform={`translate(10 10) scale(${0.85 + 0.15 * big}) translate(-10 -10)`} />
      {SMALL_STARS.map(([x, y], index) => {
        const p = pulse(0.33 * (index + 1))
        const size = 0.9 + 0.5 * p
        return (
          <path
            key={index}
            d={`M${x} ${y - size}V${y + size}M${x - size} ${y}H${x + size}`}
            stroke="#fff"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity={0.45 + 0.55 * p}
          />
        )
      })}
    </svg>
  )
}

type Props = { file: AssetFile; config: Config; time: number }

/** Dokument-Kachel aus der Asset-Vorschau, Zustand vollständig aus der Zeit berechnet */
export function AnimatedDocumentCard({ file, config, time }: Props) {
  const { t } = useI18n()
  const { chips, rows, languages } = useDocumentContent(file)
  const { effect, flag, chips: chipSteps, chevron, toc } = config

  // Effekt-Hülle: einblenden, laufen lassen, ausblenden
  const envelope = clamp01(eased(effect.in, time)) * (1 - clamp01(eased(effect.out, time)))
  const phase = (time - effect.in.start) / Math.max(1, effect.period)
  const cycle = phase - Math.floor(phase)
  const [c1, c2, c3] = effect.colors

  // Fähnchen
  const flagIn = eased(flag.in, time)
  const flagOut = clamp01(eased(flag.out, time))
  const flagShown = flagIn * (1 - flagOut)
  const twinklePhase = flag.twinkle > 0 ? (time - flag.in.start) / flag.twinkle : 0

  // Meta-Zeile: Sprache wird hineingeschrieben
  const languageText = languages.join(', ')
  const languageChars = Math.round(linear(config.language, time) * languageText.length)
  const meta = [file.size, file.pages ? t.document.pages(file.pages) : null].filter(Boolean) as string[]

  // Inhaltszeile mit Pfeil, Chips und Inhaltsverzeichnis wächst mit dem ersten Chip auf
  const rowReveal = clamp01(eased(chipSteps.in, time))
  const chipsOut = clamp01(eased(chipSteps.out, time))
  const chevronIn = clamp01(eased(chevron.in, time))
  const chevronRotate = eased(chevron.rotate, time)
  const rowCurve = cubicBezier(toc.rowEasing)

  const cardStyle = {
    '--fx-1': c1,
    '--fx-2': c2,
    '--fx-3': c3,
    width: config.stage.width,
  } as CSSProperties

  return (
    <div className={styles.wrap} style={cardStyle}>
      {/* Aura und Glow liegen hinter der Kachel */}
      {effect.variant === 'aura' && envelope > 0 && (
        <div
          className={styles.aura}
          style={{
            inset: -effect.spread,
            filter: `blur(${effect.spread * 0.8}px)`,
            opacity: envelope * effect.intensity * 0.6 * (0.6 + 0.4 * Math.sin(phase * Math.PI * 2)),
            transform: `scale(${1 + 0.015 * Math.sin(phase * Math.PI * 2)})`,
            background: `conic-gradient(from ${cycle * 360}deg, ${c1}, ${c2}, ${c3}, ${c1})`,
          }}
        />
      )}
      {effect.variant === 'border' && envelope > 0 && (
        <div
          className={styles.glow}
          style={{
            filter: `blur(${effect.glow}px)`,
            opacity: envelope * effect.intensity * 0.5,
            background: `conic-gradient(from ${cycle * 360}deg, ${c1}, ${c2}, ${c3}, ${c1})`,
          }}
        />
      )}

      {/* Stapel: weitere Kacheln schauen unten hervor, je weiter hinten desto schmaler und blasser */}
      {Array.from({ length: config.stack.count }, (_, index) => {
        const level = config.stack.count - index
        return (
          <div
            key={level}
            className={styles.stackLayer}
            style={{
              left: config.stack.inset * level,
              right: config.stack.inset * level,
              bottom: -config.stack.offset * level,
              // Deckend statt transparent, damit keine Kanten der hinteren Kacheln durchscheinen
              background: `color-mix(in srgb, var(--color-white) ${Math.max(0, 100 - config.stack.fade * level * 100)}%, #dfe3e8)`,
              borderColor: `color-mix(in srgb, var(--border-high-emphasis) ${Math.max(0, 100 - config.stack.fade * level * 100)}%, #e8ebee)`,
            }}
          />
        )
      })}

      {/* Fähnchen rechts oben, wächst aus der Oberkante */}
      {flagShown > 0.001 && (
        <div className={styles.flagClip}>
          <div
            className={styles.flag}
            style={{
              transform: `translateY(${(1 - flagShown) * 100}%)`,
              background: `linear-gradient(120deg, ${c1}, ${c2} 55%, ${c3})`,
            }}
          >
            <Sparkles phase={twinklePhase} twinkle={flag.twinkle > 0} />
          </div>
        </div>
      )}

      <article className={styles.card}>
        <div className={styles.content} style={{ opacity: 1 - effect.dim * envelope }}>
          <div className={styles.head}>
            <div className={styles.row}>
              <div className={styles.file}>
                <span className={styles.badge}>
                  <img src={pdfIcon} alt="PDF" />
                </span>
                <span className={`${styles.name} body3-medium`}>{file.name}</span>
              </div>
              <div className={styles.actions}>
                <Button icon={downloadIcon} aria-label={t.document.downloadFile(file.name)} />
                <Button icon={eyeIcon} aria-label={t.document.viewFile(file.name)} />
              </div>
            </div>
            <p className={`${styles.meta} body3-medium`}>
              {meta.map((part, index) => (
                <span key={index}>
                  {index > 0 && <span className={styles.dot}>•</span>}
                  {part}
                </span>
              ))}
              {languageChars > 0 && (
                <span>
                  <span className={styles.dot} style={{ opacity: clamp01(linear(config.language, time) * 3) }}>
                    •
                  </span>
                  {languageText.slice(0, languageChars)}
                </span>
              )}
            </p>
          </div>

          <div className={styles.reveal} style={{ gridTemplateRows: `${rowReveal}fr` }}>
            <div className={styles.revealClip}>
              <div className={styles.contentRow}>
                <span className={styles.chevron} style={{ opacity: chevronIn }}>
                  <img src={chevronRightIcon} alt="" style={{ transform: `rotate(${90 * chevronRotate}deg)` }} />
                </span>
                <div className={styles.contentBody}>
                  <div className={styles.chips} style={{ opacity: 1 - chipsOut }}>
                    {chips.map((chip, index) => {
                      const p = eased({ ...chipSteps.in, start: chipSteps.in.start + index * chipSteps.stagger }, time)
                      return (
                        <span key={chip} style={{ opacity: clamp01(p * 1.4), transform: `translateY(${(1 - p) * 4}px) scale(${0.85 + 0.15 * p})` }} className={styles.chip}>
                          <Chip>{chip}</Chip>
                        </span>
                      )
                    })}
                  </div>

                  <nav className={styles.toc} aria-label={t.document.contentsOf(file.name)}>
                    {rows.map((row, index) => {
                      const start = rowStart(config, index)
                      if (time < start) return null
                      const grow = rowCurve(clamp01((time - start) / Math.max(1, toc.rowGrow)))
                      const typingTime = typingDuration(config, row.text)
                      const chars = Math.min(row.text.length, Math.floor(((time - start) / 1000) * toc.cps))
                      const typing = chars < row.text.length
                      // Schreibmarke an der zuletzt begonnenen Zeile, bis die nächste beginnt
                      const nextStart = index + 1 < rows.length ? rowStart(config, index + 1) : Infinity
                      const showCursor = toc.cursor && (typing || time < nextStart) && time < start + typingTime + 600
                      const metaP = clamp01((time - start - typingTime) / Math.max(1, toc.metaFade))
                      const gap = row.kind === 'group' && !row.first ? 12 * grow : 0
                      return (
                        <div key={index} className={styles.tocRow} style={{ gridTemplateRows: `${grow}fr`, marginTop: gap }}>
                          <div className={styles.revealClip}>
                            {row.kind === 'group' ? (
                              <span className={`${styles.groupTitle} body3-medium`}>
                                <Typed text={row.text} chars={chars} cursor={showCursor} />
                              </span>
                            ) : (
                              <span className={styles.entry}>
                                <span className={`${styles.entryTitle} body3`}>
                                  <Typed text={row.text} chars={chars} cursor={showCursor} />
                                </span>
                                <span className={styles.leader} style={{ transform: `scaleX(${metaP})` }} />
                                <span className={styles.entryMeta} style={{ opacity: metaP }}>
                                  {row.language && <Chip size="small">{row.language}</Chip>}
                                  <span className={`${styles.pages} body3`}>{row.pages}</span>
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Effekte über der Kachel */}
        {effect.variant === 'shimmer' && envelope > 0 && (
          <div
            className={styles.overlay}
            style={{
              opacity: envelope * effect.intensity,
              background: shimmerGradient(effect.angle, effect.band, cycle, [c1, c2, c3]),
            }}
          />
        )}
        {effect.variant === 'veil' && envelope > 0 && (
          <div
            className={styles.overlay}
            style={{
              background: effect.veilColor,
              opacity: envelope * (effect.haze + Math.max(0, effect.intensity - effect.haze) * pulse(time - effect.in.start, effect.period, effect.pulseWidth)),
            }}
          />
        )}
        {effect.variant === 'aura' && envelope > 0 && (
          <div
            className={styles.overlay}
            style={{
              opacity: envelope * effect.intensity * 0.3 * (0.6 + 0.4 * Math.sin(phase * Math.PI * 2)),
              background: `radial-gradient(120% 140% at 50% 0%, ${alpha(c1, 0.2)}, ${alpha(c3, 0.1)} 50%, transparent 80%)`,
            }}
          />
        )}
      </article>

      {effect.variant === 'border' && envelope > 0 && (
        <div
          className={styles.ring}
          style={{
            padding: effect.borderWidth,
            opacity: envelope * Math.min(1, effect.intensity * 1.1),
            background: `conic-gradient(from ${cycle * 360}deg, ${c1}, ${c2}, ${c3}, ${c1})`,
          }}
        />
      )}
    </div>
  )
}

/** Lichtstreifen, der in einem Durchlauf ganz über die Kachel wandert */
function shimmerGradient(angle: number, band: number, cycle: number, [c1, c2, c3]: string[]) {
  const position = -band + cycle * (100 + 2 * band)
  const stop = (offset: number) => `${(position + offset).toFixed(2)}%`
  return `linear-gradient(${angle}deg, transparent ${stop(-band)}, ${alpha(c1, 0.14)} ${stop(-band / 2)}, ${alpha(c2, 0.22)} ${stop(0)}, ${alpha(c3, 0.14)} ${stop(band / 2)}, transparent ${stop(band)})`
}
