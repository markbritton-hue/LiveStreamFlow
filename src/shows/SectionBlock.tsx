import { useState, type FormEvent } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { durationToMinutes, type Section, type Segment } from '../types'
import { addSegment } from './useSegments'
import { deleteSection, renameSection } from './useSections'
import SegmentRow from './SegmentRow'

export default function SectionBlock({
  showId,
  section,
  sections,
  segments,
}: {
  showId: string
  section: Section
  sections: Section[]
  segments: Segment[]
}) {
  const [title, setTitle] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const { setNodeRef, isOver } = useDroppable({ id: `section-${section.id}` })

  const ordered = [...segments].sort((a, b) => a.order - b.order)
  const sectionMinutes = ordered.reduce((sum, s) => sum + durationToMinutes(s.duration), 0)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!title) return
    await addSegment(
      showId,
      {
        sectionId: section.id,
        title,
        type: 'host-script',
        scriptCopy: '',
        detail: '',
        duration: '05:00',
        owner: '',
        notes: '',
        status: 'not-started',
        assetUrl: '',
      },
      ordered.length,
    )
    setTitle('')
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
          value={section.title}
          onChange={(e) => renameSection(showId, section.id, e.target.value)}
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
                <p className="timeline-empty">Drag a block here, or use the form below.</p>
              )}
              {ordered.map((segment) => (
                <SegmentRow
                  key={segment.id}
                  showId={showId}
                  segment={segment}
                  sections={sections}
                />
              ))}
            </div>
          </SortableContext>

          <form onSubmit={handleAdd} className="new-segment-form">
            <input
              placeholder="New block title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button type="submit">Add Block</button>
          </form>
        </>
      )}
    </section>
  )
}
