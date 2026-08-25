import type { ReactNode } from 'react'
import type { SegmentType } from '../types'

const PATHS: Record<SegmentType, ReactNode> = {
  'host-script': (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </>
  ),
  video: (
    <>
      <path d="M6 2h9l5 5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20V3.5A1.5 1.5 0 0 1 6 2z" />
      <path d="M15 2v4.5A1.5 1.5 0 0 0 16.5 8H20" />
      <path d="M10.5 11.5 15 14l-4.5 2.5z" />
    </>
  ),
  graphic: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <circle cx="8" cy="10" r="2" />
      <path d="M22 16l-6-6-9 9" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V4l11-2v14" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  'camera-shot': (
    <>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="M16 10.5 22 7v10l-6-3.5z" />
    </>
  ),
  lighting: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 2z" />
    </>
  ),
  transition: (
    <>
      <path d="M4 7h13" />
      <path d="M13 3l4 4-4 4" />
      <path d="M20 17H7" />
      <path d="M11 21l-4-4 4-4" />
    </>
  ),
  note: (
    <>
      <path d="M12 2 2 21h20L12 2z" />
      <line x1="12" y1="9" x2="12" y2="14" />
      <circle cx="12" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  other: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
}

export default function SegmentTypeIcon({
  type,
  size = 20,
  className,
}: {
  type: SegmentType
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[type]}
    </svg>
  )
}
