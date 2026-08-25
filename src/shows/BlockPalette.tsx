import { useDraggable } from '@dnd-kit/core'
import { SEGMENT_TYPE_LABELS, type SegmentType } from '../types'
import SegmentTypeIcon from './SegmentTypeIcon'

const TYPES = Object.keys(SEGMENT_TYPE_LABELS) as SegmentType[]

function PaletteChip({ type }: { type: SegmentType }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: 'palette', segmentType: type },
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`palette-chip type-${type}`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
    >
      <SegmentTypeIcon type={type} size={18} className="palette-chip-icon" />
      {SEGMENT_TYPE_LABELS[type]}
    </button>
  )
}

export default function BlockPalette({ assetsFolderUrl }: { assetsFolderUrl?: string }) {
  return (
    <div className="block-palette">
      {assetsFolderUrl && (
        <a
          href={assetsFolderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="assets-folder-link"
        >
          📁 Open Assets Folder
        </a>
      )}
      <span className="block-palette-label">Drag a block in:</span>
      {TYPES.map((type) => (
        <PaletteChip key={type} type={type} />
      ))}
    </div>
  )
}
