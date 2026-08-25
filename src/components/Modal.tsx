import type { ReactNode } from 'react'

export default function Modal({
  title,
  onClose,
  children,
  size = 'default',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  size?: 'default' | 'large'
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-panel${size === 'large' ? ' modal-panel-large' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
