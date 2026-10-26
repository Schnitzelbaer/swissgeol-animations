import { Fragment, useEffect, useRef } from 'react'
import { Button } from '../Button'
import { Chip } from '../Chip'
import { Section } from './Section'
import { DocumentCard } from './DocumentCard'
import { asset } from '../../data/asset'
import { useStore } from '../../data/store'
import styles from './PreviewPanel.module.css'
import closeIcon from '../../assets/icons/close.svg'
import linkIcon from '../../assets/icons/link.svg'
import copyIcon from '../../assets/icons/copy.svg'
import exportIcon from '../../assets/icons/export.svg'
import duplicateIcon from '../../assets/icons/duplicate.svg'
import editIcon from '../../assets/icons/edit.svg'

function Chips({ items, gap = 6 }: { items: string[]; gap?: number | string }) {
  return (
    <div className={styles.chips} style={{ gap }}>
      {items.map((item) => (
        <Chip key={item}>{item}</Chip>
      ))}
    </div>
  )
}

function LabeledValue({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.labeled}>
      <span className={`${styles.label} ellipsis`}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  onOpenDocument: (fileId: string, page?: number) => void
  openTocs: string[]
  onToggleToc: (fileId: string) => void
  onEdit: () => void
}

export function PreviewPanel({ open, onClose, onOpenDocument, openTocs, onToggleToc, onEdit }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { files } = useStore()
  const documents = files.filter((file) => !file.legal)
  const legal = files.filter((file) => file.legal)

  // Beim erneuten Öffnen wieder oben beginnen
  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: 0 })
  }, [open])

  return (
    <aside className={`${styles.panel} ${open ? styles.open : ''}`} aria-label="Asset-Vorschau" inert={!open}>
      <header className={styles.title}>
        <h2 className="body2-bold ellipsis">{asset.title}</h2>
        <Button icon={closeIcon} aria-label="Vorschau schliessen" onClick={onClose} />
      </header>

      <div ref={scrollRef} className={styles.scroll}>
        <div className={styles.content}>
          <div className={styles.statusRow}>
            <div className={styles.statusCard}>
              <span className="body3-medium">Status</span>
              <Chip tone="success">{asset.status}</Chip>
            </div>
            <div className={styles.statusCard}>
              <span className="body3-medium">Beschränkung</span>
              <Chip tone="neutral">{asset.restriction}</Chip>
            </div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.group} style={{ gap: 16 }}>
            <Section title="Dokumente" flush>
              {documents.map((file, index) => (
                <Fragment key={file.id}>
                  {index > 0 && <hr className={styles.itemDivider} />}
                  <DocumentCard
                    file={file}
                    tocOpen={openTocs.includes(file.id)}
                    onToggleToc={() => onToggleToc(file.id)}
                    onOpen={(page) => onOpenDocument(file.id, page)}
                  />
                </Fragment>
              ))}
            </Section>
            {legal.length > 0 && (
              <Section title="Rechtliche Einwilligungen" flush>
                {legal.map((file, index) => (
                  <Fragment key={file.id}>
                    {index > 0 && <hr className={styles.itemDivider} />}
                    <DocumentCard file={file} showToc={false} onOpen={(page) => onOpenDocument(file.id, page)} />
                  </Fragment>
                ))}
              </Section>
            )}
          </div>

          <hr className={styles.divider} />

          <div className={styles.group} style={{ gap: 12 }}>
            <Section title="Thema">
              <Chips items={asset.topics} />
            </Section>
            <Section title="Typ">
              <Chips items={asset.type} />
            </Section>
            <Section title="Sprache">
              <Chips items={asset.languages} />
            </Section>
          </div>

          <hr className={styles.divider} />

          <div className={styles.group} style={{ gap: 16 }}>
            <Section title="Originaltitel">
              <p className="body3-medium">{asset.originalTitle}</p>
            </Section>

            <Section title="Datum">
              <div className={`${styles.columns} body3-medium`} style={{ gap: 3 }}>
                {asset.dates.map((date) => (
                  <LabeledValue key={date.label} {...date} />
                ))}
              </div>
            </Section>

            <Section title="Nationales Interesse" gap={16}>
              <p className="body3-medium">{asset.nationalInterest.value}</p>
              <hr className={styles.rule} />
              <Chips items={asset.nationalInterest.reasons} gap="4px 6px" />
            </Section>

            <Section title="Kontakte" gap={16}>
              {asset.contacts.map((contact, index) => (
                <Fragment key={contact.role}>
                  {index > 0 && <hr className={styles.rule} />}
                  <div className={styles.contactGroup}>
                    <span className={`${styles.label} body3-medium ellipsis`}>{contact.role}</span>
                    <Chips items={contact.names} gap={4} />
                  </div>
                </Fragment>
              ))}
            </Section>

            <Section title="Alternativ-ID’s" gap={16}>
              {asset.alternativeIds.map((entry, index) => (
                <Fragment key={index}>
                  {index > 0 && <hr className={styles.rule} />}
                  <div className={`${styles.columns} body3-medium`} style={{ gap: 16 }}>
                    <LabeledValue label="ID" value={entry.id} />
                    <LabeledValue label="Description" value={entry.description} />
                  </div>
                </Fragment>
              ))}
            </Section>
          </div>

          <hr className={styles.divider} />

          <Section title="Verweise" gap={16} paddingBottom={20}>
            {asset.references.map((reference, index) => (
              <Fragment key={reference}>
                {index > 0 && <hr className={styles.rule} />}
                <a href="#" className={styles.reference} onClick={(event) => event.preventDefault()}>
                  <img src={linkIcon} alt="" />
                  <span className="body3-medium">{reference}</span>
                </a>
              </Fragment>
            ))}
          </Section>
        </div>
      </div>

      <footer className={styles.footer}>
        <Button variant="secondary" grow icon={copyIcon} label="Direktlink" />
        <Button variant="secondary" grow icon={exportIcon} label="Export" />
        <Button variant="secondary" grow icon={duplicateIcon} label="Duplizieren" />
        <Button variant="primary" grow icon={editIcon} label="Bearbeiten" onClick={onEdit} />
      </footer>
    </aside>
  )
}
