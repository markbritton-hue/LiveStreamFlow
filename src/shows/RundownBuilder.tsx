import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { durationToMinutes, SEGMENT_TYPE_LABELS, type SegmentType, type Show } from '../types'
import { addSegment, reorderSegments, useSegments } from './useSegments'
import { createSection, useSections } from './useSections'
import SectionBlock from './SectionBlock'
import BlockPalette from './BlockPalette'
import SegmentTypeIcon from './SegmentTypeIcon'

interface DragData {
  source?: 'palette'
  segmentType?: SegmentType
}

export default function RundownBuilder({ show }: { show: Show }) {
  const { sections, loading: sectionsLoading } = useSections(show.id)
  const { segments, loading: segmentsLoading } = useSegments(show.id)
  const [creatingDefault, setCreatingDefault] = useState(false)
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const totalMinutes = segments.reduce((sum, s) => sum + durationToMinutes(s.duration), 0)

  useEffect(() => {
    if (sectionsLoading || creatingDefault || sections.length > 0) return
    setCreatingDefault(true)
    createSection(show.id, 'Part 1', 0).finally(() => setCreatingDefault(false))
  }, [sectionsLoading, sections.length, creatingDefault, show.id])

  async function handleAddSection() {
    await createSection(show.id, `Part ${sections.length + 1}`, sections.length)
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDrag((event.active.data.current as DragData) ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over ? String(event.over.id) : null)
  }

  function handleDragCancel() {
    setActiveDrag(null)
    setOverId(null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null)
    setOverId(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as DragData | undefined

    if (activeData?.source === 'palette' && activeData.segmentType) {
      const overIsSectionContainer = String(over.id).startsWith('section-')
      const targetSectionId = overIsSectionContainer
        ? String(over.id).slice('section-'.length)
        : segments.find((s) => s.id === over.id)?.sectionId

      if (!targetSectionId) return

      const sectionSegments = segments
        .filter((s) => s.sectionId === targetSectionId)
        .sort((a, b) => a.order - b.order)

      const insertBeforeIndex = overIsSectionContainer
        ? -1
        : sectionSegments.findIndex((s) => s.id === over.id)

      const newId = await addSegment(
        show.id,
        {
          sectionId: targetSectionId,
          title: SEGMENT_TYPE_LABELS[activeData.segmentType],
          type: activeData.segmentType,
          scriptCopy: '',
          detail: '',
          duration: '05:00',
          owner: '',
          notes: '',
          status: 'not-started',
          assetUrl: '',
        },
        sectionSegments.length,
      )

      if (insertBeforeIndex !== -1) {
        const orderedIds = sectionSegments.map((s) => s.id)
        orderedIds.splice(insertBeforeIndex, 0, newId)
        await reorderSegments(show.id, orderedIds)
      }
      return
    }

    if (active.id === over.id) return

    const activeSegment = segments.find((s) => s.id === active.id)
    if (!activeSegment) return

    const sectionSegments = segments
      .filter((s) => s.sectionId === activeSegment.sectionId)
      .sort((a, b) => a.order - b.order)

    const oldIndex = sectionSegments.findIndex((s) => s.id === active.id)
    const newIndex = sectionSegments.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...sectionSegments]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    await reorderSegments(
      show.id,
      reordered.map((s) => s.id),
    )
  }

  const loading = sectionsLoading || segmentsLoading

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="rundown-layout">
        <BlockPalette />

        <div className="rundown-builder">
          <div className="rundown-summary">
            <span>
              Total: {totalMinutes} / {show.targetDurationMinutes} min
            </span>
            {totalMinutes > show.targetDurationMinutes && (
              <span className="over-time">
                {' '}
                — over target by {totalMinutes - show.targetDurationMinutes} min
              </span>
            )}
          </div>

          {loading ? (
            <p>Loading rundown…</p>
          ) : (
            sections.map((section) => (
              <SectionBlock
                key={section.id}
                showId={show.id}
                section={section}
                sections={sections}
                segments={segments.filter((s) => s.sectionId === section.id)}
                dropBeforeId={activeDrag?.source === 'palette' ? overId : null}
              />
            ))
          )}

          <button type="button" className="new-section-button" onClick={handleAddSection}>
            + Add Section
          </button>
        </div>
      </div>

      <DragOverlay>
        {activeDrag?.source === 'palette' && activeDrag.segmentType ? (
          <div className={`palette-chip type-${activeDrag.segmentType} palette-chip-overlay`}>
            <SegmentTypeIcon type={activeDrag.segmentType} size={18} className="palette-chip-icon" />
            {SEGMENT_TYPE_LABELS[activeDrag.segmentType]}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
