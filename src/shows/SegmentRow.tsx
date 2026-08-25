import { useState, type DragEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  detectAssetType,
  getImageDisplayUrl,
  getVideoEmbedUrl,
  getVideoThumbnail,
  SEGMENT_TYPE_LABELS,
  type Section,
  type Segment,
  type SegmentType,
} from '../types'
import { deleteSegment, updateSegment } from './useSegments'
import SegmentTypeIcon from './SegmentTypeIcon'
import Modal from '../components/Modal'

const TYPES = Object.keys(SEGMENT_TYPE_LABELS) as SegmentType[]

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
}: {
  showId: string
  segment: Segment
  sections: Section[]
  onDuplicate?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: segment.id,
  })
  const [expanded, setExpanded] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)

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

  async function moveToSection(targetSectionId: string) {
    if (targetSectionId === segment.sectionId) return
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

  return (
    <div ref={setNodeRef} style={style} className="timeline-item">
      <div className="timeline-rail">
        <span className={`timeline-dot type-${segment.type}`} title={SEGMENT_TYPE_LABELS[segment.type]}>
          <SegmentTypeIcon type={segment.type} size={26} />
        </span>
        <span className="timeline-line" />
      </div>

      <div
        className={`block status-${segment.status} type-${segment.type}${expanded ? ' block-expanded' : ' block-collapsed'}`}
      >
        {segment.ready && <span className="ready-badge">✓ Ready</span>}

        <div className="block-header">
          <span className="drag-handle" {...attributes} {...listeners}>
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
          />

          <select
            value={segment.type}
            onChange={(e) =>
              updateSegment(showId, segment.id, { type: e.target.value as SegmentType })
            }
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
          />

          <span className="block-header-thumb-slot">
            {(isGraphicBlock || isVideoBlock) && mediaThumbnail && (
              <button
                type="button"
                className="block-header-thumb-button"
                onClick={() => setShowImagePreview(true)}
                aria-label={isVideoBlock ? 'View video thumbnail' : 'View full image'}
              >
                <img src={mediaThumbnail} alt="" className="block-header-thumb" />
                {isVideoBlock && <span className="block-header-thumb-play">▶</span>}
              </button>
            )}
          </span>

          <label className="ready-checkbox-label" title="Mark ready">
            <input
              type="checkbox"
              checked={!!segment.ready}
              onChange={(e) => updateSegment(showId, segment.id, { ready: e.target.checked })}
            />
          </label>

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

          <button
            type="button"
            className="delete-button"
            onClick={() => deleteSegment(showId, segment.id)}
            aria-label="Delete segment"
          >
            ✕
          </button>
        </div>

        {!expanded && !isMediaBlock && !isNotesOnlyBlock && (scriptCopy || detail) && (
          <button type="button" className="block-collapsed-preview" onClick={() => setExpanded(true)}>
            {scriptCopy || detail}
          </button>
        )}

        {!expanded && isMediaBlock && (assetUrl || notes) && (
          <button type="button" className="block-collapsed-preview" onClick={() => setExpanded(true)}>
            {isVideoBlock && notes ? notes : assetUrl}
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
            />
            {assetUrl && (
              <a className="asset-open-link" href={assetUrl} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            )}
            {mediaThumbnail && (
              <div className="block-asset-preview">
                <img src={mediaThumbnail} alt={segment.title} loading="lazy" />
              </div>
            )}

            {isVideoBlock && (
              <textarea
                className="segment-script"
                placeholder="Notes..."
                value={notes}
                onChange={(e) => commitField(setNotes, 'notes', e.target.value)}
                rows={2}
              />
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
            />

            <div className="block-body">
              <input
                className="segment-detail"
                placeholder="Detail (hometown, gown notes, selection, bio...)"
                value={detail}
                onChange={(e) => commitField(setDetail, 'detail', e.target.value)}
              />
              <input
                className="segment-owner"
                placeholder="Owner"
                value={owner}
                onChange={(e) => commitField(setOwner, 'owner', e.target.value)}
              />
              <input
                className="segment-notes"
                placeholder="Notes"
                value={notes}
                onChange={(e) => commitField(setNotes, 'notes', e.target.value)}
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
              />
              {assetUrl && (
                <a className="asset-open-link" href={assetUrl} target="_blank" rel="noopener noreferrer">
                  Open
                </a>
              )}
              {sections.length > 1 && (
                <select
                  className="move-to-section"
                  value={segment.sectionId}
                  onChange={(e) => moveToSection(e.target.value)}
                  title="Move to section"
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
                assetUrl.includes('dropbox.com')) && (
                <div className="block-asset-preview">
                  <img src={getImageDisplayUrl(assetUrl)} alt={segment.title} loading="lazy" />
                </div>
              )}
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
            <video src={videoEmbed.src} controls autoPlay className="video-preview-modal-frame" />
          )}
          {(!isVideoBlock || !videoEmbed) && (
            <img src={mediaThumbnail} alt={segment.title} className="image-preview-modal-img" />
          )}
        </Modal>
      )}
    </div>
  )
}
