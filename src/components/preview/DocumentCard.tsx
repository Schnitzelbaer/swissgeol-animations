import { Fragment } from 'react'
import { Button } from '../Button'
import { Chip, ChipSeparator } from '../Chip'
import type { DocumentFile } from '../../data/asset'
import styles from './DocumentCard.module.css'
import fileIcon from '../../assets/icons/file.svg'
import downloadIcon from '../../assets/icons/download.svg'
import eyeIcon from '../../assets/icons/eye.svg'
import chevronRightIcon from '../../assets/icons/chevron-right.svg'

function ChipLine({ groups }: { groups: string[][] }) {
  return (
    <div className={styles.chipLine}>
      {groups.map((group, index) => (
        <Fragment key={index}>
          {index > 0 && <ChipSeparator />}
          {group.map((chip) => (
            <Chip key={chip}>{chip}</Chip>
          ))}
        </Fragment>
      ))}
    </div>
  )
}

/** Datei-Karte («Content – Assets Preview») mit Download/Vorschau und Inhaltsangabe */
export function DocumentCard({ file }: { file: DocumentFile }) {
  const multiline = (file.content?.length ?? 0) > 1

  return (
    <article className={styles.card}>
      <div className={styles.row}>
        <div className={styles.file}>
          <span className={styles.fileIcon}>
            <img src={fileIcon} alt="" />
          </span>
          <span className={`body3-medium ellipsis ${file.showContentLabel ? styles.nameGrow : styles.name}`} title={file.name}>
            {file.name}
          </span>
          {file.chips.map((chip) => (
            <Chip key={chip}>{chip}</Chip>
          ))}
        </div>
        <div className={styles.actions}>
          <Button variant="secondary-solid" icon={downloadIcon} aria-label={`${file.name} herunterladen`} />
          <Button variant="secondary-solid" icon={eyeIcon} aria-label={`${file.name} anzeigen`} />
        </div>
      </div>

      {file.content && (
        <>
          <hr className={styles.divider} />
          <div className={`${styles.contentRow} ${multiline ? styles.multiline : ''}`}>
            {file.showContentLabel && (
              <button type="button" className={styles.contentLabel}>
                <span className={styles.chevron}>
                  <img src={chevronRightIcon} alt="" />
                </span>
                <span className="body3-medium">Inhalt:</span>
              </button>
            )}
            <div className={styles.lines}>
              {file.content.map((groups, index) => (
                <ChipLine key={index} groups={groups} />
              ))}
            </div>
          </div>
        </>
      )}
    </article>
  )
}
