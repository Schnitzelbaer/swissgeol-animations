import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

type Props = {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Vollflächiges Modal (12px Rand) oder kleiner Dialog in der Mitte */
  variant?: 'fullscreen' | 'dialog'
  label: string
}

const EXIT_MS = 250

/**
 * Modal mit dunkler Überlagerung («dialog / building blocks / modal overlay») und Ein-/Ausblend-Animation.
 * Der Aufrufer behält den Inhalt beim Schliessen bei, damit er während der Ausblendung sichtbar bleibt.
 */
export function Modal({ open, onClose, children, variant = 'fullscreen', label }: Props) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    setVisible(false)
    const timer = window.setTimeout(() => setMounted(false), EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [open])

  // Nach dem Einhängen einen Layout-Durchlauf erzwingen, damit die Einblend-Transition startet
  // (ohne requestAnimationFrame, das in Hintergrund-Tabs pausiert)
  useLayoutEffect(() => {
    if (!open || !mounted || visible) return
    void overlayRef.current?.offsetWidth
    setVisible(true)
  }, [open, mounted, visible])

  // Escape schliesst nur das oberste Modal
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      // Ein offenes Auswahlfeld (Combobox) schliesst mit Escape zuerst seine Liste
      const focused = document.activeElement
      if (focused?.getAttribute('role') === 'combobox' && focused.getAttribute('aria-expanded') === 'true') return
      event.preventDefault()
      onCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open])

  if (!mounted) return null

  return createPortal(
    <div ref={overlayRef} className={`${styles.overlay} ${styles[variant]} ${visible ? styles.visible : ''}`} onMouseDown={(event) => event.target === event.currentTarget && variant === 'dialog' && onClose()}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
