export interface Show {
  id: string
  title: string
  scheduledAt: string // ISO datetime — start
  endsAt: string // ISO datetime — end (may be empty)
  targetDurationMinutes: number
  status: 'planned' | 'live' | 'completed'
  ownerId: string
  createdBy: string
  createdAt: string // ISO datetime
  location: string
  notes: string
  teamMembers: string[]
  guestEmails: string[]
  assetsFolderUrl: string
  liveCurrentSegmentId: string
  roles: ShowRole[]
}

export interface ShowRole {
  id: string
  role: string
  name: string
}

export const DEFAULT_SHOW_ROLE_LABELS = [
  'Producer',
  'Switcher',
  'Camera',
  'Camera',
  'Host',
  'Audio',
  'Lights',
  'FX',
  'Editor',
  'Director',
]

export function makeDefaultShowRoles(): ShowRole[] {
  return DEFAULT_SHOW_ROLE_LABELS.map((role) => ({ id: crypto.randomUUID(), role, name: '' }))
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
  | 'divider'
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
  divider: 'Section',
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
  ready: boolean
  loop: boolean
  linkedToNext: boolean
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
const GOOGLE_DRIVE_ID = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/i

const GOOGLE_DRIVE_FOLDER_ID = /drive\.google\.com\/drive\/folders\/([\w-]+)/i

export function getDriveFolderEmbedUrl(url: string): string | null {
  const match = url.match(GOOGLE_DRIVE_FOLDER_ID)
  return match ? `https://drive.google.com/embeddedfolderview?id=${match[1]}#list` : null
}

export function getDriveFileId(url: string): string | null {
  const match = url.match(GOOGLE_DRIVE_ID)
  return match ? match[1] : null
}

function getDriveThumbnail(url: string): string | null {
  const match = url.match(GOOGLE_DRIVE_ID)
  return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000` : null
}

export function getDriveDirectFileUrl(url: string): string | null {
  const match = url.match(GOOGLE_DRIVE_ID)
  return match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : null
}

export function getVideoThumbnail(url: string): string | null {
  if (!url) return null
  const youtubeMatch = url.match(YOUTUBE_ID)
  if (youtubeMatch) return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`
  return getDriveThumbnail(url)
}

const DIRECT_VIDEO_FILE = /\.(mp4|webm|ogg|mov)(\?.*)?$/i

export function getVideoEmbedUrl(url: string): { kind: 'iframe' | 'video'; src: string } | null {
  if (!url) return null

  const youtubeMatch = url.match(YOUTUBE_ID)
  if (youtubeMatch) {
    return { kind: 'iframe', src: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1` }
  }

  const driveMatch = url.match(GOOGLE_DRIVE_ID)
  if (driveMatch) {
    return { kind: 'iframe', src: `https://drive.google.com/file/d/${driveMatch[1]}/preview` }
  }

  if (DIRECT_VIDEO_FILE.test(url)) {
    return { kind: 'video', src: url }
  }

  return null
}

const DIRECT_AUDIO_FILE = /\.(mp3|wav|m4a|aac|ogg|flac)(\?.*)?$/i

export function getDirectAudioUrl(url: string): string | null {
  if (!url) return null
  return DIRECT_AUDIO_FILE.test(url) ? url : null
}

export function getImageDisplayUrl(url: string): string {
  if (!url) return url

  const driveThumb = getDriveThumbnail(url)
  if (driveThumb) return driveThumb

  if (url.includes('dropbox.com')) {
    const stripped = url.replace(/[?&]dl=[01]/, '').replace(/\?$/, '')
    return stripped + (stripped.includes('?') ? '&raw=1' : '?raw=1')
  }

  return url
}

export function formatShowRange(startIso: string, endIso: string | undefined): string {
  const start = new Date(startIso)
  if (Number.isNaN(start.getTime())) return ''
  const startStr = start.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  if (!endIso) return startStr
  const end = new Date(endIso)
  if (Number.isNaN(end.getTime())) return startStr

  const sameDay = start.toDateString() === end.toDateString()
  const endStr = end.toLocaleString(
    undefined,
    sameDay ? { timeStyle: 'short' } : { dateStyle: 'medium', timeStyle: 'short' },
  )
  return `${startStr} – ${endStr}`
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
