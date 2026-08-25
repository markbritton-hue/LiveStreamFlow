import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { durationToMinutes, type Section, type Segment } from '../types'
import { addSegment, reorderSegments } from './useSegments'
import { deleteSection, renameSection } from './useSections'
import { matchesFilters, type AssetFilter, type ReadyFilter } from './rundownFilters'
import SegmentRow from './SegmentRow'

export default function SectionBlock({
  showId,
  section,
  sections,
  segments,
  dropBeforeId,
  readyFilter = 'all',
  assetFilter = 'all',
  assetsFolderUrl,
}: {
  showId: string
  section: Section
  sections: Section[]
  segments: Segment[]
  dropBeforeId?: string | null
  readyFilter?: ReadyFilter
  assetFilter?: AssetFilter
  assetsFolderUrl?: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [title, setTitle] = useState(section.title)
  const { setNodeRef, isOver } = useDroppable({ id: `section-${section.id}` })

  function handleRename(value: string) {
    setTitle(value)
    renameSection(showId, section.id, value)
  }

  const ordered = [...segments].sort((a, b) => a.order - b.order)
  const sectionMinutes = ordered.reduce((sum, s) => sum + durationToMinutes(s.duration), 0)

  async function handleDuplicate(segment: Segment) {
    const { id, order, ...rest } = segment
    void id
    void order
    const newId = await addSegment(showId, rest, ordered.length)
    const orderedIds = ordered.map((s) => s.id)
    const insertIndex = orderedIds.indexOf(segment.id) + 1
    orderedIds.splice(insertIndex, 0, newId)
    await reorderSegments(showId, orderedIds)
  }

  return (
    <section className="section-block">
      <div className="section-header">
        <button
          type="button"
          className="section-collapse-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand section' : 'Collapse section'}
        >
          {collapsed ? '▸' : '▾'}
        </button>
        <input
          className="section-title"
          value={title}
          onChange={(e) => handleRename(e.target.value)}
        />
        <span className="section-meta">
          {ordered.length} block{ordered.length === 1 ? '' : 's'} · {sectionMinutes} min
        </span>
        <button
          type="button"
          className="delete-button"
          onClick={() => deleteSection(showId, section.id)}
          aria-label="Delete section"
        >
          ✕
        </button>
      </div>

      {!collapsed && (
        <>
          <SortableContext items={ordered.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div ref={setNodeRef} className={`timeline${isOver ? ' timeline-drop-hover' : ''}`}>
              {ordered.length === 0 && (
                <p className="timeline-empty">Drag a block here from the palette.</p>
              )}
              {ordered.length > 0 &&
                !ordered.some((s) => matchesFilters(s, readyFilter, assetFilter)) && (
                  <p className="timeline-empty">No blocks match the current filters.</p>
                )}
              {ordered.map((segment) => (
                <div
                  key={segment.id}
                  className={matchesFilters(segment, readyFilter, assetFilter) ? undefined : 'filtered-out'}
                >
                  {dropBeforeId === segment.id && <div className="drop-indicator" />}
                  <SegmentRow
                    showId={showId}
                    segment={segment}
                    sections={sections}
                    onDuplicate={() => handleDuplicate(segment)}
                    assetsFolderUrl={assetsFolderUrl}
                  />
                </div>
              ))}
              {dropBeforeId === `section-${section.id}` && ordered.length > 0 && (
                <div className="drop-indicator" />
              )}
            </div>
          </SortableContext>
        </>
      )}
    </section>
  )
}
