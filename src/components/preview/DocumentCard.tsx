import { Button, ButtonLink } from '../Button'
import { Chip } from '../Chip'
import { TruncatedText } from '../Tooltip'
import { CLASSES_WITHOUT_LANGUAGE, fileLanguages, groupSections, pageRange, sectionTitle, type AssetFile } from '../../data/files'
import { useI18n } from '../../i18n'
import styles from './DocumentCard.module.css'
import pdfIcon from '../../assets/icons/filetype-pdf.svg'
import csvIcon from '../../assets/icons/filetype-csv.svg'
import downloadIcon from '../../assets/icons/download.svg'
import eyeIcon from '../../assets/icons/eye.svg'
import chevronRightIcon from '../../assets/icons/chevron-right.svg'

type Props = {
  file: AssetFile
  /** Rechtliche Einwilligungen zeigen die Klassen ohne aufklappbares Inhaltsverzeichnis */
  showToc?: boolean
  tocOpen?: boolean
  onToggleToc?: () => void
  onOpen: (page?: number) => void
}

/** Datei-Eintrag im Abschnitt «Dokumente» (Figma «Content – Assets Preview», Überarbeitung 20858:11963) */
export function DocumentCard({ file, showToc = true, tocOpen = false, onToggleToc, onOpen }: Props) {
  const { t } = useI18n()
  const groups = groupSections(file.sections ?? [])
  // Ohne «Title page»: Jedes Dokument hat eine Titelseite, der Chip sagt nichts aus (im Inhaltsverzeichnis bleibt sie)
  const classLabels = groups.filter((group) => group.type !== 'Titelblatt').map((group) => t.pageClassGroup[group.type])
  const languages = fileLanguages(file)
  const meta = [file.size, file.pages ? t.document.pages(file.pages) : null, languages.length ? languages.join(', ') : null].filter(Boolean) as string[]
  const withToc = showToc && groups.length > 0
  const isPdf = file.format === 'PDF'

  // Der Eintrag selbst ist nicht klickbar; geöffnet wird über das Auge oder einen Inhaltsverzeichnis-Eintrag
  return (
    <article className={`${styles.item} ${tocOpen ? styles.tocOpen : ''}`}>
      <div className={styles.head}>
        <div className={styles.row}>
          <div className={styles.file}>
            <span className={`${styles.badge} ${isPdf ? styles.pdf : styles.csv}`}>
              <img src={isPdf ? pdfIcon : csvIcon} alt={file.format === 'PDF' ? 'PDF' : 'CSV'} />
            </span>
            <TruncatedText text={file.name} className={`${styles.name} body3-medium`} />
          </div>
          <div className={styles.actions}>
            {file.url ? (
              <ButtonLink icon={downloadIcon} href={file.url} download={file.name} aria-label={t.document.downloadFile(file.name)} />
            ) : (
              <Button icon={downloadIcon} aria-label={t.document.downloadFile(file.name)} />
            )}
            <Button icon={eyeIcon} aria-label={t.document.viewFile(file.name)} disabled={!file.url} onClick={() => onOpen()} />
          </div>
        </div>
        <p className={`${styles.meta} body3-medium`}>
          {meta.map((part, index) => (
            <span key={index}>
              {index > 0 && <span className={styles.dot}>•</span>}
              {part}
            </span>
          ))}
        </p>
      </div>

      {(classLabels.length > 0 || withToc) && (
        <div className={styles.contentRow}>
          {/* Ohne Inhaltsverzeichnis bleibt der Platz des Pfeils frei, damit die Chips gleich eingerückt sind */}
          <button
            type="button"
            className={`${styles.chevron} ${withToc ? '' : styles.chevronHidden}`}
            aria-label={tocOpen ? t.document.closeToc : t.document.openToc}
            aria-expanded={withToc ? tocOpen : undefined}
            disabled={!withToc}
            tabIndex={withToc ? 0 : -1}
            onClick={onToggleToc}
          >
            <img src={chevronRightIcon} alt="" />
          </button>
          {/* Das Inhaltsverzeichnis öffnet rechts neben dem Pfeil an der Stelle der Chips */}
          <div className={styles.contentBody}>
            <div className={styles.chips} aria-hidden={tocOpen}>
              {classLabels.map((chip) => (
                <Chip key={chip}>{chip}</Chip>
              ))}
            </div>

            {withToc && (
              <div className={styles.tocCollapse}>
                <div className={styles.tocClip}>
                  <nav className={styles.toc} aria-label={t.document.contentsOf(file.name)}>
                    {groups.map((group) => (
                      <div key={group.type} className={styles.group}>
                        <span className={`${styles.groupTitle} body3-medium`}>{t.pageClassGroup[group.type]}</span>
                        <ul className={styles.entries}>
                          {group.sections.map((section) => {
                            const showLanguage = section.language && !CLASSES_WITHOUT_LANGUAGE.includes(section.type)
                            return (
                              <li key={section.id}>
                                <button type="button" className={styles.entry} onClick={() => onOpen(section.from)}>
                                  <TruncatedText text={sectionTitle(section, t.pageClass)} className={`${styles.entryTitle} body3`} />
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
        </div>
      )}
    </article>
  )
}
