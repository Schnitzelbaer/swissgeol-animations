import { useLayoutEffect, useRef, useState } from 'react'
import { Button, ButtonLink } from '../Button'
import { Chip, ChipSeparator } from '../Chip'
import { TruncatedText, useTooltip } from '../Tooltip'
import { CLASSES_WITHOUT_LANGUAGE, fileLanguages, groupSections, pageRange, sectionTitle, type AssetFile } from '../../data/files'
import styles from './DocumentCard.module.css'
import fileIcon from '../../assets/icons/file.svg'
import downloadIcon from '../../assets/icons/download.svg'
import eyeIcon from '../../assets/icons/eye.svg'
import chevronRightIcon from '../../assets/icons/chevron-right.svg'

/** Anzahl Klassen-Chips, danach folgt «+N» mit Tooltip */
const MAX_CLASS_CHIPS = 3

function OverflowChip({ hidden }: { hidden: string[] }) {
  const { handlers, tooltip } = useTooltip(hidden.join(', '))
  return (
    <span {...handlers} tabIndex={0} className={styles.overflowChip}>
      <Chip>+{hidden.length}</Chip>
      {tooltip}
    </span>
  )
}

type Props = {
  file: AssetFile
  /** Rechtliche Einwilligungen zeigen die Chips ohne «Inhalt»-Aufklapper */
  showToc?: boolean
  tocOpen?: boolean
  onToggleToc?: () => void
  onOpen: (page?: number) => void
}

/** Datei-Karte («Content – Assets Preview») mit Download, Vorschau und Inhaltsverzeichnis */
export function DocumentCard({ file, showToc = true, tocOpen = false, onToggleToc, onOpen }: Props) {
  const groups = groupSections(file.sections ?? [])
  const classLabels = groups.map((group) => group.label)
  const visibleClasses = classLabels.slice(0, MAX_CLASS_CHIPS)
  const hiddenClasses = classLabels.slice(MAX_CLASS_CHIPS)
  const meta = [file.pages ? `${file.pages} Seiten` : null, ...fileLanguages(file)].filter(Boolean) as string[]
  const hasContent = file.format === 'PDF' && (meta.length > 0 || classLabels.length > 0)
  const withToc = showToc && groups.length > 0

  // Mehrzeilige Chips: «Inhalt»-Zeile richtet sich oben aus (wie in Figma)
  const chipsRef = useRef<HTMLDivElement>(null)
  const [multiline, setMultiline] = useState(false)
  useLayoutEffect(() => {
    const element = chipsRef.current
    if (!element) return
    const update = () => setMultiline(element.offsetHeight > 30)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <article className={`${styles.card} ${tocOpen ? styles.tocOpen : ''}`}>
      <div className={styles.row}>
        <div className={styles.file}>
          <span className={styles.fileIcon}>
            <img src={fileIcon} alt="" />
          </span>
          <TruncatedText text={file.name} className={`body3-medium ${withToc ? styles.nameGrow : styles.name}`} />
          <Chip>{file.format}</Chip>
          <Chip>{file.size}</Chip>
        </div>
        <div className={styles.actions}>
          {file.url ? (
            <ButtonLink variant="secondary-solid" icon={downloadIcon} href={file.url} download={file.name} aria-label={`${file.name} herunterladen`} tooltip="Herunterladen" />
          ) : (
            <Button variant="secondary-solid" icon={downloadIcon} aria-label={`${file.name} herunterladen`} />
          )}
          <Button
            variant="secondary-solid"
            icon={eyeIcon}
            aria-label={`${file.name} anzeigen`}
            tooltip="Anzeigen"
            disabled={!file.url}
            onClick={() => onOpen()}
          />
        </div>
      </div>

      {hasContent && (
        <>
          <hr className={styles.divider} />
          <div className={styles.bottom}>
            <div className={`${styles.contentRow} ${multiline ? styles.multiline : ''} ${withToc ? '' : styles.plain}`}>
              {withToc && (
                <button type="button" className={styles.contentLabel} aria-expanded={tocOpen} onClick={onToggleToc}>
                  <span className={styles.chevron}>
                    <img src={chevronRightIcon} alt="" />
                  </span>
                  <span className="body3-medium">Inhalt:</span>
                </button>
              )}
              <div ref={chipsRef} className={styles.chips} aria-hidden={tocOpen}>
                {meta.map((chip) => (
                  <Chip key={chip}>{chip}</Chip>
                ))}
                {visibleClasses.map((chip, index) => (
                  <span key={chip} className={styles.chipUnit}>
                    {index === 0 && meta.length > 0 && <ChipSeparator />}
                    <Chip>{chip}</Chip>
                  </span>
                ))}
                {hiddenClasses.length > 0 && <OverflowChip hidden={hiddenClasses} />}
              </div>
            </div>

            {withToc && (
              <div className={styles.tocCollapse}>
                <div className={styles.tocClip}>
                  <nav className={styles.toc} aria-label={`Inhalt von ${file.name}`}>
                    {groups.map((group) => (
                      <div key={group.type} className={styles.group}>
                        <span className={`${styles.groupTitle} body3-medium`}>{group.label}</span>
                        <ul className={styles.entries}>
                          {group.sections.map((section) => {
                            const showLanguage = section.language && !CLASSES_WITHOUT_LANGUAGE.includes(section.type)
                            return (
                              <li key={section.id}>
                                <button type="button" className={styles.entry} onClick={() => onOpen(section.from)}>
                                  <TruncatedText text={sectionTitle(section)} className={`${styles.entryTitle} body3`} />
                                  <span className={styles.leader} />
                                  <span className={styles.entryMeta}>
                                    {showLanguage && <Chip size="small">{section.language}</Chip>}
                                    <span className={`${styles.pages} body3`}>{pageRange(section)}</span>
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </nav>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </article>
  )
}
