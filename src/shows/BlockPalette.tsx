import { useDraggable } from '@dnd-kit/core'
import { SEGMENT_TYPE_ICONS, SEGMENT_TYPE_LABELS, type SegmentType } from '../types'

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
      {SEGMENT_TYPE_ICONS[type]} {SEGMENT_TYPE_LABELS[type]}
    </button>
  )
}

export default function BlockPalette() {
  return (
    <div className="block-palette">
      <span className="block-palette-label">Drag a block in:</span>
      {TYPES.map((type) => (
        <PaletteChip key={type} type={type} />
      ))}
    </div>
  )
}
