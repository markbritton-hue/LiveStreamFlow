import { useEffect, useState, type DragEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  detectAssetType,
  getImageDisplayUrl,
  getDirectAudioUrl,
  getDriveDirectFileUrl,
  getDriveFileId,
  getVideoEmbedUrl,
  getVideoThumbnail,
  SEGMENT_TYPE_LABELS,
  type Section,
  type Segment,
  type SegmentType,
} from '../types'
import { deleteSegment, updateSegment } from './useSegments'
import { fetchDriveVideoDurationSeconds } from './driveApi'
import SegmentTypeIcon from './SegmentTypeIcon'
import Modal from '../components/Modal'
import AssetPickerModal from './AssetPickerModal'

const TYPES = Object.keys(SEGMENT_TYPE_LABELS) as SegmentType[]

function formatVideoLength(seconds: number): string {
  const totalSeconds = Math.round(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

const ASSET_ICON: Record<ReturnType<typeof detectAssetType>, string> = {
  image: '🖼️',
  video: '🎬',
  doc: '📄',
  link: '🔗',
  none: '➕',
}

export default function SegmentRow({
  showId,
  segment,
  sections,
  onDuplicate,
  assetsFolderUrl,
  liveMode = false,
  readOnly = false,
  isCurrent = false,
  onSetCurrent,
  isLastInSection = false,
}: {
  showId: string
  segment: Segment
  sections: Section[]
  onDuplicate?: () => void
  assetsFolderUrl?: string
  liveMode?: boolean
  readOnly?: boolean
  isCurrent?: boolean
  onSetCurrent?: (segmentId: string) => void
  isLastInSection?: boolean
}) {
  const locked = liveMode || readOnly
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: segment.id,
    disabled: locked,
  })
  const [expanded, setExpanded] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [showAssetPicker, setShowAssetPicker] = useState(false)

  // Local-first text state: typing updates these immediately and writes through to
  // Firestore, but the displayed value never gets overwritten by the async
  // onSnapshot echo — that round-trip lag was resetting the cursor to the end
  // of the field on every keystroke.
  const [title, setTitle] = useState(segment.title)
  const [duration, setDuration] = useState(segment.duration ?? '')
  const [scriptCopy, setScriptCopy] = useState(segment.scriptCopy)
  const [detail, setDetail] = useState(segment.detail)
  const [owner, setOwner] = useState(segment.owner)
  const [notes, setNotes] = useState(segment.notes)
  const [assetUrl, setAssetUrl] = useState(segment.assetUrl)

  function commitField<K extends keyof Segment>(
    setLocal: (value: Segment[K]) => void,
    field: K,
    value: Segment[K],
  ) {
    if (locked) return
    setLocal(value)
    updateSegment(showId, segment.id, { [field]: value } as Partial<Segment>)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const assetType = detectAssetType(assetUrl)
  const isVideoBlock = segment.type === 'video'
  const isGraphicBlock = segment.type === 'graphic'
  const isMusicBlock = segment.type === 'music'
  const isNotesOnlyBlock =
    segment.type === 'camera-shot' || segment.type === 'transition' || segment.type === 'other'
  const isMediaBlock = isVideoBlock || isGraphicBlock || isMusicBlock
  const mediaThumbnail = isVideoBlock
    ? getVideoThumbnail(assetUrl)
    : isGraphicBlock && assetUrl
      ? getImageDisplayUrl(assetUrl)
      : null
  const videoEmbed = isVideoBlock && assetUrl ? getVideoEmbedUrl(assetUrl) : null

  const [detectedLengthSeconds, setDetectedLengthSeconds] = useState<number | null>(null)

  useEffect(() => {
    setDetectedLengthSeconds(null)
    if (!(isVideoBlock || isMusicBlock) || !assetUrl) return

    if (isVideoBlock) {
      const driveFileId = getDriveFileId(assetUrl)
      if (driveFileId) {
        let cancelled = false
        fetchDriveVideoDurationSeconds(driveFileId).then((seconds) => {
          if (!cancelled && seconds !== null) setDetectedLengthSeconds(seconds)
        })
        return () => {
          cancelled = true
        }
      }

      if (videoEmbed?.kind !== 'video') return

      const videoEl = document.createElement('video')
      videoEl.preload = 'metadata'
      videoEl.src = videoEmbed.src

      function handleLoaded() {
        if (Number.isFinite(videoEl.duration)) {
          setDetectedLengthSeconds(videoEl.duration)
        }
      }

      videoEl.addEventListener('loadedmetadata', handleLoaded)
      return () => {
        videoEl.removeEventListener('loadedmetadata', handleLoaded)
        videoEl.src = ''
      }
    }

    // Music block: Drive's API has no audio-duration field, so best-effort
    // probe the direct download URL (works for some files, fails silently
    // for others — same "can't scan for viruses" caveat as video).
    const probeUrl = getDriveDirectFileUrl(assetUrl) ?? getDirectAudioUrl(assetUrl)
    if (!probeUrl) return

    const audioEl = document.createElement('audio')
    audioEl.preload = 'metadata'
    audioEl.src = probeUrl

    function handleAudioLoaded() {
      if (Number.isFinite(audioEl.duration)) {
        setDetectedLengthSeconds(audioEl.duration)
      }
    }

    audioEl.addEventListener('loadedmetadata', handleAudioLoaded)
    return () => {
      audioEl.removeEventListener('loadedmetadata', handleAudioLoaded)
      audioEl.src = ''
    }
  }, [isVideoBlock, isMusicBlock, assetUrl, videoEmbed?.kind, videoEmbed?.src])

  function toggleLink() {
    if (locked) return
    updateSegment(showId, segment.id, { linkedToNext: !segment.linkedToNext })
  }

  async function moveToSection(targetSectionId: string) {
    if (locked || targetSectionId === segment.sectionId) return
    await updateSegment(showId, segment.id, { sectionId: targetSectionId, order: Date.now() })
  }

  function handleAssetDragOver(e: DragEvent) {
    e.preventDefault()
  }

  function handleAssetDrop(e: DragEvent) {
    e.preventDefault()
    const url =
      e.dataTransfer.getData('text/uri-list') ||
      e.dataTransfer.getData('text/plain') ||
      e.dataTransfer.getData('text/html')?.match(/href="([^"]+)"/)?.[1]
    if (url) {
      commitField(setAssetUrl, 'assetUrl', url.trim())
    }
  }

  if (segment.type === 'divider') {
    return (
      <div
        id={`segment-${segment.id}`}
        ref={setNodeRef}
        style={style}
        className={`timeline-item${liveMode ? ' timeline-item-live' : ''}${segment.linkedToNext ? ' timeline-item-linked' : ''}`}
      >
        <div className="timeline-rail">
          {liveMode ? (
            <button
              type="button"
              className="timeline-dot type-divider timeline-dot-button"
              title="Jump to here"
              onClick={() => onSetCurrent?.(segment.id)}
            >
              <SegmentTypeIcon type="divider" size={22} />
            </button>
          ) : (
            <span className="timeline-dot type-divider" title="Section">
              <SegmentTypeIcon type="divider" size={22} />
            </span>
          )}
          {isLastInSection ? (
            <span className="timeline-connector-spacer" />
          ) : (
            <button
              type="button"
              className={`timeline-connector${segment.linkedToNext ? ' timeline-connector-linked' : ''}`}
              onClick={toggleLink}
              disabled={locked}
              title={segment.linkedToNext ? 'Unlink from next block' : 'Link to next block (run together)'}
            />
          )}
        </div>

        <div className={`divider-bar${isCurrent ? ' block-live-current' : ''}`}>
          <span
            className={`drag-handle${locked ? ' drag-handle-disabled' : ''}`}
            {...attributes}
            {...listeners}
          >
            ⠿
          </span>
          <input
            className="divider-bar-title"
            value={title}
            onChange={(e) => commitField(setTitle, 'title', e.target.value)}
            placeholder="Section name"
            disabled={locked}
          />
          {!locked && (
            <button
              type="button"
              className="delete-button"
              onClick={() => {
                if (window.confirm('Delete this section block?')) deleteSegment(showId, segment.id)
              }}
              aria-label="Delete section"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      id={`segment-${segment.id}`}
      ref={setNodeRef}
      style={style}
      className={`timeline-item${liveMode ? ' timeline-item-live' : ''}${segment.linkedToNext ? ' timeline-item-linked' : ''}`}
    >
      <div className="timeline-rail">
        {liveMode ? (
          <button
            type="button"
            className={`timeline-dot type-${segment.type} timeline-dot-button`}
            title="Jump to here"
            onClick={() => onSetCurrent?.(segment.id)}
          >
            <SegmentTypeIcon type={segment.type} size={26} />
          </button>
        ) : (
          <span className={`timeline-dot type-${segment.type}`} title={SEGMENT_TYPE_LABELS[segment.type]}>
            <SegmentTypeIcon type={segment.type} size={26} />
          </span>
        )}
        {isLastInSection ? (
          <span className="timeline-connector-spacer" />
        ) : (
          <button
            type="button"
            className={`timeline-connector${segment.linkedToNext ? ' timeline-connector-linked' : ''}`}
            onClick={toggleLink}
            disabled={locked}
            title={segment.linkedToNext ? 'Unlink from next block' : 'Link to next block (run together)'}
          />
        )}
      </div>

      <div
        className={`block status-${segment.status} type-${segment.type}${expanded ? ' block-expanded' : ' block-collapsed'}${isCurrent ? ' block-live-current' : ''}${liveMode && !isCurrent ? ' block-live-dimmed' : ''}`}
      >

        <div className="block-header">
          <span
            className={`drag-handle${locked ? ' drag-handle-disabled' : ''}`}
            {...attributes}
            {...listeners}
          >
            ⠿
          </span>

          <button
            type="button"
            className="block-expand-toggle"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Collapse block' : 'Expand block'}
          >
            {expanded ? '▾' : '▸'}
          </button>

          <input
            className="segment-title"
            value={title}
            onChange={(e) => commitField(setTitle, 'title', e.target.value)}
            disabled={locked}
          />

          <select
            value={segment.type}
            onChange={(e) =>
              updateSegment(showId, segment.id, { type: e.target.value as SegmentType })
            }
            disabled={locked}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {SEGMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{1,2}:[0-9]{2}"
            placeholder="MM:SS"
            className="segment-duration"
            value={duration}
            onChange={(e) => commitField(setDuration, 'duration', e.target.value)}
            title="Duration (MM:SS)"
            disabled={locked}
          />

          <span className="video-length-pill-slot">
            {(isVideoBlock || isMusicBlock) && detectedLengthSeconds !== null && (
              <span className="video-length-pill">{formatVideoLength(detectedLengthSeconds)}</span>
            )}
            {isVideoBlock && segment.loop && (
              <span className="loop-icon" title="Loops">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 2 21 6 17 10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 12v-2a4 4 0 0 1 4-4h14" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 22 3 18 7 14" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12v2a4 4 0 0 1-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </span>

          <span className="block-header-thumb-slot">
            {(isGraphicBlock || isVideoBlock) &&
              mediaThumbnail &&
              (failedImageUrl === mediaThumbnail ? (
                <a
                  href={assetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block-header-thumb-fallback"
                  title="Thumbnail unavailable — click to open the file"
                >
                  ⚠️
                </a>
              ) : (
                <button
                  type="button"
                  className="block-header-thumb-button"
                  onClick={() => setShowImagePreview(true)}
                  aria-label={isVideoBlock ? 'View video thumbnail' : 'View full image'}
                >
                  <img
                    src={mediaThumbnail}
                    alt=""
                    className="block-header-thumb"
                    onError={() => setFailedImageUrl(mediaThumbnail)}
                  />
                  {isVideoBlock && <span className="block-header-thumb-play">▶</span>}
                </button>
              ))}
          </span>

          <span className="ready-checkbox-label">
            {!locked && (
              <input
                type="checkbox"
                checked={!!segment.ready}
                onChange={(e) => updateSegment(showId, segment.id, { ready: e.target.checked })}
                title="Mark ready"
              />
            )}
          </span>

          {!locked && (
            <button
              type="button"
              className="duplicate-button"
              onClick={() => onDuplicate?.()}
              aria-label="Duplicate block"
              title="Duplicate block"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="8" y="8" width="13" height="13" rx="2" />
                <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          )}

          {!locked && (
            <button
              type="button"
              className="delete-button"
              onClick={() => {
                if (window.confirm('Delete this block?')) deleteSegment(showId, segment.id)
              }}
              aria-label="Delete segment"
            >
              ✕
            </button>
          )}
        </div>

        {!expanded && !isMediaBlock && !isNotesOnlyBlock && (scriptCopy || detail) && (
          <button type="button" className="block-collapsed-preview" onClick={() => setExpanded(true)}>
            {scriptCopy || detail}
          </button>
        )}

        {!expanded && (isVideoBlock || isMusicBlock) && notes && (
          <button type="button" className="block-collapsed-preview" onClick={() => setExpanded(true)}>
            {notes}
          </button>
        )}

        {!expanded && isNotesOnlyBlock && notes && (
          <button type="button" className="block-collapsed-preview" onClick={() => setExpanded(true)}>
            {notes}
          </button>
        )}

        {expanded && isMediaBlock && (
          <div className="block-asset media-only">
            <span className="asset-icon" title={assetType}>
              {ASSET_ICON[assetType]}
            </span>
            <input
              className="segment-asset-url"
              placeholder={
                isVideoBlock
                  ? 'Video URL — or drag a file here'
                  : isMusicBlock
                    ? 'Music/audio URL — or drag a file here'
                    : 'Graphic/image URL — or drag a file here'
              }
              value={assetUrl}
              onChange={(e) => commitField(setAssetUrl, 'assetUrl', e.target.value)}
              onDragOver={handleAssetDragOver}
              onDrop={handleAssetDrop}
              disabled={locked}
            />
            {assetUrl && (
              <a className="asset-open-link" href={assetUrl} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            )}
            {assetsFolderUrl && !locked && (
              <button
                type="button"
                className="asset-folder-link"
                onClick={() => setShowAssetPicker(true)}
                title="Browse assets folder"
              >
                📁
              </button>
            )}
            {mediaThumbnail &&
              (failedImageUrl === mediaThumbnail ? (
                <p className="thumbnail-fallback-hint">
                  ⚠️ Thumbnail unavailable — the file may not be shared as "Anyone with the link."
                </p>
              ) : (
                <button
                  type="button"
                  className="block-asset-preview block-asset-preview-button"
                  onClick={() => setShowImagePreview(true)}
                  aria-label={isVideoBlock ? 'Play video' : 'View full image'}
                >
                  <img
                    src={mediaThumbnail}
                    alt={segment.title}
                    loading="lazy"
                    onError={() => setFailedImageUrl(mediaThumbnail)}
                  />
                  {isVideoBlock && <span className="block-asset-preview-play">▶</span>}
                </button>
              ))}

            {(isVideoBlock || isMusicBlock) && (
              <textarea
                className="segment-script"
                placeholder="Notes..."
                value={notes}
                onChange={(e) => commitField(setNotes, 'notes', e.target.value)}
                rows={2}
                disabled={locked}
              />
            )}

            {isVideoBlock && (
              <label className="loop-checkbox-label">
                <input
                  type="checkbox"
                  checked={!!segment.loop}
                  onChange={(e) => updateSegment(showId, segment.id, { loop: e.target.checked })}
                  disabled={locked}
                />
                Loop video
              </label>
            )}
          </div>
        )}

        {expanded && isNotesOnlyBlock && (
          <textarea
            className="segment-script"
            placeholder="Notes..."
            value={notes}
            onChange={(e) => commitField(setNotes, 'notes', e.target.value)}
            rows={2}
            disabled={locked}
          />
        )}

        {expanded && !isMediaBlock && !isNotesOnlyBlock && (
          <>
            <textarea
              className="segment-script"
              placeholder="Script copy — host lines, [stage directions]..."
              value={scriptCopy}
              onChange={(e) => commitField(setScriptCopy, 'scriptCopy', e.target.value)}
              rows={2}
              disabled={locked}
            />

            <div className="block-body">
              <input
                className="segment-detail"
                placeholder="Detail (hometown, gown notes, selection, bio...)"
                value={detail}
                onChange={(e) => commitField(setDetail, 'detail', e.target.value)}
                disabled={locked}
              />
              <input
                className="segment-owner"
                placeholder="Owner"
                value={owner}
                onChange={(e) => commitField(setOwner, 'owner', e.target.value)}
                disabled={locked}
              />
              <input
                className="segment-notes"
                placeholder="Notes"
                value={notes}
                onChange={(e) => commitField(setNotes, 'notes', e.target.value)}
                disabled={locked}
              />
            </div>

            <div className="block-asset">
              <span className="asset-icon" title={assetType}>
                {ASSET_ICON[assetType]}
              </span>
              <input
                className="segment-asset-url"
                placeholder="Asset link — or drag a file here"
                value={assetUrl}
                onChange={(e) => commitField(setAssetUrl, 'assetUrl', e.target.value)}
                onDragOver={handleAssetDragOver}
                onDrop={handleAssetDrop}
                disabled={locked}
              />
              {assetUrl && (
                <a className="asset-open-link" href={assetUrl} target="_blank" rel="noopener noreferrer">
                  Open
                </a>
              )}
              {assetsFolderUrl && !locked && (
                <button
                  type="button"
                  className="asset-folder-link"
                  onClick={() => setShowAssetPicker(true)}
                  title="Browse assets folder"
                >
                  📁
                </button>
              )}
              {sections.length > 1 && (
                <select
                  className="move-to-section"
                  value={segment.sectionId}
                  onChange={(e) => moveToSection(e.target.value)}
                  title="Move to section"
                  disabled={locked}
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      → {s.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {assetUrl &&
              (assetType === 'image' ||
                assetUrl.includes('drive.google.com') ||
                assetUrl.includes('dropbox.com')) &&
              (failedImageUrl === getImageDisplayUrl(assetUrl) ? (
                <p className="thumbnail-fallback-hint">
                  ⚠️ Thumbnail unavailable — the file may not be shared as "Anyone with the link."
                </p>
              ) : (
                <div className="block-asset-preview">
                  <img
                    src={getImageDisplayUrl(assetUrl)}
                    alt={segment.title}
                    loading="lazy"
                    onError={() => setFailedImageUrl(getImageDisplayUrl(assetUrl))}
                  />
                </div>
              ))}
          </>
        )}
      </div>

      {showImagePreview && mediaThumbnail && (
        <Modal
          title={segment.title || (isVideoBlock ? 'Video' : 'Image')}
          onClose={() => setShowImagePreview(false)}
          size="large"
        >
          {isVideoBlock && videoEmbed?.kind === 'iframe' && (
            <iframe
              src={videoEmbed.src}
              className="video-preview-modal-frame"
              allow="autoplay; fullscreen"
              allowFullScreen
              title={segment.title || 'Video'}
            />
          )}
          {isVideoBlock && videoEmbed?.kind === 'video' && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={videoEmbed.src}
              controls
              autoPlay
              loop={segment.loop}
              className="video-preview-modal-frame"
            />
          )}
          {(!isVideoBlock || !videoEmbed) && (
            <img src={mediaThumbnail} alt={segment.title} className="image-preview-modal-img" />
          )}
        </Modal>
      )}

      {showAssetPicker && assetsFolderUrl && (
        <AssetPickerModal
          folderUrl={assetsFolderUrl}
          onClose={() => setShowAssetPicker(false)}
          onSelect={(url) => {
            commitField(setAssetUrl, 'assetUrl', url)
            setShowAssetPicker(false)
          }}
        />
      )}
    </div>
  )
}
