import type { Segment } from '../types'

export type ReadyFilter = 'all' | 'ready' | 'not-ready'
export type AssetFilter = 'all' | 'video' | 'graphic' | 'music'

export function matchesFilters(
  segment: Segment,
  readyFilter: ReadyFilter,
  assetFilter: AssetFilter,
): boolean {
  if (readyFilter === 'ready' && !segment.ready) return false
  if (readyFilter === 'not-ready' && segment.ready) return false
  if (assetFilter !== 'all' && segment.type !== assetFilter) return false
  return true
}
