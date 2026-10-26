import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Tooltip.module.css'

type Position = { left: number; top: number; placement: 'top' | 'bottom' }

/**
 * Dunkler Tooltip («Tooltip – Top») über dem Element. Wird in document.body gerendert,
 * damit er nicht von Karten mit overflow: hidden abgeschnitten wird.
 */
export function useTooltip(content: ReactNode, { onlyWhenTruncated = false, maxWidth = 304 } = {}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const show = (element: HTMLElement) => {
    if (onlyWhenTruncated && !isTruncated(element)) return
    setAnchor(element)
  }
  const hide = () => {
    setAnchor(null)
    setPosition(null)
  }

  useLayoutEffect(() => {
    if (!anchor || !tooltipRef.current) return
    const rect = anchor.getBoundingClientRect()
    const tip = tooltipRef.current.getBoundingClientRect()
    const above = rect.top - tip.height - 8
    const placement = above < 8 ? 'bottom' : 'top'
    const left = Math.min(Math.max(rect.left + rect.width / 2 - tip.width / 2, 8), window.innerWidth - tip.width - 8)
    setPosition({ left, top: placement === 'top' ? above : rect.bottom + 8, placement })
  }, [anchor])

  const handlers = {
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => show(event.currentTarget),
    onMouseLeave: hide,
    onFocus: (event: React.FocusEvent<HTMLElement>) => show(event.currentTarget),
    onBlur: hide,
  }

  const tooltip =
    anchor &&
    createPortal(
      <div
        ref={tooltipRef}
        role="tooltip"
        className={`${styles.tooltip} ${position ? styles.visible : ''} ${position?.placement === 'bottom' ? styles.bottom : ''}`}
        style={{ left: position?.left ?? -9999, top: position?.top ?? -9999, maxWidth }}
      >
        {content}
      </div>,
      document.body,
    )

  return { handlers, tooltip }
}

function isTruncated(element: HTMLElement) {
  const target = (element.querySelector('[data-truncate]') as HTMLElement | null) ?? element
  return target.scrollWidth > target.clientWidth + 1 || target.scrollHeight > target.clientHeight + 1
}

type TruncatedTextProps = {
  text: string
  /** Anzahl Zeilen, nach denen mit Ellipse abgeschnitten wird */
  lines?: number
  className?: string
}

/** Text mit Ellipse; der volle Text erscheint als Tooltip, sobald er abgeschnitten ist */
export function TruncatedText({ text, lines = 1, className }: TruncatedTextProps) {
  const { handlers, tooltip } = useTooltip(text, { onlyWhenTruncated: true })
  return (
    <span
      {...handlers}
      data-truncate
      className={`${lines === 1 ? 'ellipsis' : styles.clamp} ${className ?? ''}`}
      style={lines > 1 ? { WebkitLineClamp: lines } : undefined}
    >
      {text}
      {tooltip}
    </span>
  )
}

/** Hilfskomponente für Elemente, die immer einen Tooltip zeigen (z.B. Icon-Buttons) */
export function WithTooltip({ content, children }: { content: ReactNode; children: (handlers: ReturnType<typeof useTooltip>['handlers']) => ReactNode }) {
  const { handlers, tooltip } = useTooltip(content)
  return (
    <>
      {children(handlers)}
      {tooltip}
    </>
  )
}
