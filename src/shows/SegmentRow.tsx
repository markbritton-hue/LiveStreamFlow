import { useState, type DragEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  detectAssetType,
  getImageDisplayUrl,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const assetType = detectAssetType(segment.assetUrl)
  const isVideoBlock = segment.type === 'video'
  const isGraphicBlock = segment.type === 'graphic'
  const isMusicBlock = segment.type === 'music'
  const isNotesOnlyBlock = segment.type === 'camera-shot' || segment.type === 'transition'
  const isMediaBlock = isVideoBlock || isGraphicBlock || isMusicBlock
  const mediaThumbnail = isVideoBlock
    ? getVideoThumbnail(segment.assetUrl)
    : isGraphicBlock && segment.assetUrl
      ? getImageDisplayUrl(segment.assetUrl)
      : null

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
      updateSegment(showId, segment.id, { assetUrl: url.trim() })
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
            value={segment.title}
            onChange={(e) => updateSegment(showId, segment.id, { title: e.target.value })}
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
            value={segment.duration ?? ''}
            onChange={(e) => updateSegment(showId, segment.id, { duration: e.target.value })}
            title="Duration (MM:SS)"
          />

          <span className="block-header-thumb-slot">
            {isGraphicBlock && mediaThumbnail && (
              <button
                type="button"
                className="block-header-thumb-button"
                onClick={() => setShowImagePreview(true)}
                aria-label="View full image"
              >
                <img src={mediaThumbnail} alt="" className="block-header-thumb" />
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

        {!expanded && !isMediaBlock && !isNotesOnlyBlock && (segment.scriptCopy || segment.detail) && (
          <button type="button" className="block-collapsed-preview" onClick={() => setExpanded(true)}>
            {segment.scriptCopy || segment.detail}
          </button>
        )}

        {!expanded && isMediaBlock && (segment.assetUrl || segment.notes) && (
          <button type="button" className="block-collapsed-preview" onClick={() => setExpanded(true)}>
            {isVideoBlock && segment.notes ? segment.notes : segment.assetUrl}
          </button>
        )}

        {!expanded && isNotesOnlyBlock && segment.notes && (
          <button type="button" className="block-collapsed-preview" onClick={() => setExpanded(true)}>
            {segment.notes}
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
              value={segment.assetUrl}
              onChange={(e) => updateSegment(showId, segment.id, { assetUrl: e.target.value })}
              onDragOver={handleAssetDragOver}
              onDrop={handleAssetDrop}
            />
            {segment.assetUrl && (
              <a
                className="asset-open-link"
                href={segment.assetUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
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
                value={segment.notes}
                onChange={(e) => updateSegment(showId, segment.id, { notes: e.target.value })}
                rows={2}
              />
            )}
          </div>
        )}

        {expanded && isNotesOnlyBlock && (
          <textarea
            className="segment-script"
            placeholder="Notes..."
            value={segment.notes}
            onChange={(e) => updateSegment(showId, segment.id, { notes: e.target.value })}
            rows={2}
          />
        )}

        {expanded && !isMediaBlock && !isNotesOnlyBlock && (
          <>
            <textarea
              className="segment-script"
              placeholder="Script copy — host lines, [stage directions]..."
              value={segment.scriptCopy}
              onChange={(e) => updateSegment(showId, segment.id, { scriptCopy: e.target.value })}
              rows={2}
            />

            <div className="block-body">
              <input
                className="segment-detail"
                placeholder="Detail (hometown, gown notes, selection, bio...)"
                value={segment.detail}
                onChange={(e) => updateSegment(showId, segment.id, { detail: e.target.value })}
              />
              <input
                className="segment-owner"
                placeholder="Owner"
                value={segment.owner}
                onChange={(e) => updateSegment(showId, segment.id, { owner: e.target.value })}
              />
              <input
                className="segment-notes"
                placeholder="Notes"
                value={segment.notes}
                onChange={(e) => updateSegment(showId, segment.id, { notes: e.target.value })}
              />
            </div>

            <div className="block-asset">
              <span className="asset-icon" title={assetType}>
                {ASSET_ICON[assetType]}
              </span>
              <input
                className="segment-asset-url"
                placeholder="Asset link — or drag a file here"
                value={segment.assetUrl}
                onChange={(e) => updateSegment(showId, segment.id, { assetUrl: e.target.value })}
                onDragOver={handleAssetDragOver}
                onDrop={handleAssetDrop}
              />
              {segment.assetUrl && (
                <a
                  className="asset-open-link"
                  href={segment.assetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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

            {segment.assetUrl &&
              (assetType === 'image' ||
                segment.assetUrl.includes('drive.google.com') ||
                segment.assetUrl.includes('dropbox.com')) && (
                <div className="block-asset-preview">
                  <img src={getImageDisplayUrl(segment.assetUrl)} alt={segment.title} loading="lazy" />
                </div>
              )}
          </>
        )}
      </div>

      {showImagePreview && mediaThumbnail && (
        <Modal title={segment.title || 'Image'} onClose={() => setShowImagePreview(false)} size="large">
          <img src={mediaThumbnail} alt={segment.title} className="image-preview-modal-img" />
        </Modal>
      )}
    </div>
  )
}
