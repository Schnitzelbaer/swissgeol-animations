import { Fragment, useEffect, useRef } from 'react'
import { Button } from '../Button'
import { Chip } from '../Chip'
import { Section } from './Section'
import { DocumentCard } from './DocumentCard'
import type { Asset } from '../../data/assets'
import { useStore } from '../../data/store'
import { useI18n } from '../../i18n'
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
  asset: Asset
  open: boolean
  onClose: () => void
  onOpenDocument: (fileId: string, page?: number) => void
  openTocs: string[]
  onToggleToc: (fileId: string) => void
  onOpenAsset: (assetId: string) => void
  onEdit: () => void
}

export function PreviewPanel({ asset, open, onClose, onOpenDocument, openTocs, onToggleToc, onOpenAsset, onEdit }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { lang, t } = useI18n()
  const { files } = useStore()
  const assetFiles = files.filter((file) => file.assetId === asset.id)
  const documents = assetFiles.filter((file) => !file.legal)
  const legal = assetFiles.filter((file) => file.legal)

  // Beim Öffnen und beim Wechsel des Assets wieder oben beginnen
  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: 0 })
  }, [open, asset.id])

  return (
    <aside className={`${styles.panel} ${open ? styles.open : ''}`} aria-label={t.panel.label} inert={!open}>
      <header className={styles.title}>
        <h2 key={asset.id} className={`${styles.assetTitle} body2-bold ellipsis`}>
          {asset.title}
        </h2>
        <Button icon={closeIcon} aria-label={t.panel.close} onClick={onClose} />
      </header>

      <div ref={scrollRef} className={styles.scroll}>
        {/* key: Beim Wechsel des Assets blendet der Inhalt neu ein */}
        <div key={asset.id} className={styles.content}>
          <div className={styles.statusRow}>
            <div className={styles.statusCard}>
              <span className="body3-medium">{t.panel.status}</span>
              <Chip tone="success">{t.codes.status[asset.status]}</Chip>
            </div>
            <div className={styles.statusCard}>
              <span className="body3-medium">{t.panel.restriction}</span>
              <Chip tone="neutral">{t.codes.restriction[asset.restriction]}</Chip>
            </div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.group} style={{ gap: 16 }}>
            <Section title={t.panel.documents} flush>
              {documents.length === 0 && <p className={`${styles.emptyDocuments} body3`}>{t.panel.noDocuments}</p>}
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
              <Section title={t.panel.legal} flush>
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
            <Section title={t.panel.topic}>
              <Chips items={asset.topics.map((topic) => t.codes.topic[topic])} />
            </Section>
            <Section title={t.panel.type}>
              <Chips items={asset.kinds.map((kind) => t.codes.kind[kind])} />
            </Section>
            <Section title={t.panel.language}>
              <Chips items={asset.languages.map((language) => t.codes.language[language])} />
            </Section>
          </div>

          <hr className={styles.divider} />

          <div className={styles.group} style={{ gap: 16 }}>
            <Section title={t.panel.originalTitle}>
              <p className="body3-medium">{asset.originalTitle}</p>
            </Section>

            <Section title={t.panel.date}>
              <div className={`${styles.columns} body3-medium`} style={{ gap: 3 }}>
                <LabeledValue label={t.panel.created} value={asset.dates.created} />
                <LabeledValue label={t.panel.received} value={asset.dates.received} />
              </div>
            </Section>

            <Section title={t.panel.nationalInterest} gap={16}>
              <p className="body3-medium">{asset.nationalInterest.value ? t.codes.yes : t.codes.no}</p>
              {asset.nationalInterest.reasons.length > 0 && (
                <>
                  <hr className={styles.rule} />
                  <Chips items={asset.nationalInterest.reasons.map((reason) => t.codes.nationalInterest[reason])} gap="4px 6px" />
                </>
              )}
            </Section>

            <Section title={t.panel.contacts} gap={16}>
              {asset.contacts.map((contact, index) => (
                <Fragment key={contact.role}>
                  {index > 0 && <hr className={styles.rule} />}
                  <div className={styles.contactGroup}>
                    <span className={`${styles.label} body3-medium ellipsis`}>{t.codes.role[contact.role]}</span>
                    <Chips items={contact.names} gap={4} />
                  </div>
                </Fragment>
              ))}
            </Section>

            <Section title={t.panel.alternativeIds} gap={16}>
              {asset.alternativeIds.length === 0 && <p className="body3-medium">–</p>}
              {asset.alternativeIds.map((entry, index) => (
                <Fragment key={index}>
                  {index > 0 && <hr className={styles.rule} />}
                  <div className={`${styles.columns} body3-medium`} style={{ gap: 16 }}>
                    <LabeledValue label={t.panel.id} value={entry.id} />
                    <LabeledValue label={t.panel.description} value={entry.description[lang]} />
                  </div>
                </Fragment>
              ))}
            </Section>
          </div>

          <hr className={styles.divider} />

          <Section title={t.panel.references} gap={16} paddingBottom={20}>
            {asset.references.length === 0 && <p className="body3-medium">–</p>}
            {asset.references.map((reference, index) => (
              <Fragment key={reference.label}>
                {index > 0 && <hr className={styles.rule} />}
                <a
                  href={reference.assetId ? `/asset/${reference.assetId}` : '#'}
                  className={styles.reference}
                  onClick={(event) => {
                    event.preventDefault()
                    if (reference.assetId) onOpenAsset(reference.assetId)
                  }}
                >
                  <img src={linkIcon} alt="" />
                  <span className="body3-medium">{reference.label}</span>
                </a>
              </Fragment>
            ))}
          </Section>
        </div>
      </div>

      <footer className={styles.footer}>
        <Button variant="secondary" grow icon={copyIcon} label={t.panel.directLink} />
        <Button variant="secondary" grow icon={exportIcon} label={t.panel.export} />
        <Button variant="secondary" grow icon={duplicateIcon} label={t.panel.duplicate} />
        <Button variant="primary" grow icon={editIcon} label={t.panel.edit} onClick={onEdit} />
      </footer>
    </aside>
  )
}
