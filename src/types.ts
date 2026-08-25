export interface Show {
  id: string
  title: string
  scheduledAt: string // ISO datetime
  targetDurationMinutes: number
  status: 'planned' | 'live' | 'completed'
  createdBy: string
  createdAt: string // ISO datetime
  location: string
  notes: string
  teamMembers: string[]
  guestEmails: string[]
}

export type SegmentType =
  | 'host-script'
  | 'video'
  | 'graphic'
  | 'music'
  | 'camera-shot'
  | 'lighting'
  | 'transition'
  | 'note'
  | 'other'
export type SegmentStatus = 'not-started' | 'live' | 'done'

export const SEGMENT_TYPE_LABELS: Record<SegmentType, string> = {
  'host-script': 'Host Script',
  video: 'Video',
  graphic: 'Graphic',
  music: 'Music',
  'camera-shot': 'Camera Shot',
  lighting: 'Lighting',
  transition: 'Transition',
  note: 'Note',
  other: 'Other',
}

export type AssetType = 'image' | 'video' | 'doc' | 'link' | 'none'

export interface Section {
  id: string
  title: string
  order: number
}

export interface Segment {
  id: string
  sectionId: string
  order: number
  title: string
  type: SegmentType
  scriptCopy: string
  detail: string
  duration: string // HH:MM:SS
  owner: string
  notes: string
  status: SegmentStatus
  assetUrl: string
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i
const DOC_EXT = /\.(pdf|docx?|pptx?|xlsx?)(\?.*)?$/i
const VIDEO_HOSTS = /(youtube\.com|youtu\.be|vimeo\.com|\.mp4$)/i

export function detectAssetType(url: string): AssetType {
  if (!url) return 'none'
  if (IMAGE_EXT.test(url)) return 'image'
  if (VIDEO_HOSTS.test(url)) return 'video'
  if (DOC_EXT.test(url)) return 'doc'
  return 'link'
}

const YOUTUBE_ID = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/i

export function getVideoThumbnail(url: string): string | null {
  const match = url.match(YOUTUBE_ID)
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null
}

const GOOGLE_DRIVE_ID = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/i

export function getImageDisplayUrl(url: string): string {
  if (!url) return url

  const driveMatch = url.match(GOOGLE_DRIVE_ID)
  if (driveMatch) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`
  }

  if (url.includes('dropbox.com')) {
    const stripped = url.replace(/[?&]dl=[01]/, '').replace(/\?$/, '')
    return stripped + (stripped.includes('?') ? '&raw=1' : '?raw=1')
  }

  return url
}

export function durationToMinutes(duration: string | undefined): number {
  if (!duration) return 0
  const parts = duration.split(':')
  const [h, m, s] = parts.length >= 3 ? parts : ['0', parts[0], parts[1]]
  const hours = Number(h) || 0
  const minutes = Number(m) || 0
  const seconds = Number(s) || 0
  return hours * 60 + minutes + seconds / 60
}
