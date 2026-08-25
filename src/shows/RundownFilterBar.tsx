import type { AssetFilter, ReadyFilter } from './rundownFilters'

const READY_OPTIONS: { value: ReadyFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ready', label: 'Ready' },
  { value: 'not-ready', label: 'Not Ready' },
]

const ASSET_OPTIONS: { value: AssetFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'video', label: 'Video' },
  { value: 'graphic', label: 'Graphic' },
  { value: 'music', label: 'Music' },
]

export default function RundownFilterBar({
  readyFilter,
  onReadyFilterChange,
  assetFilter,
  onAssetFilterChange,
}: {
  readyFilter: ReadyFilter
  onReadyFilterChange: (value: ReadyFilter) => void
  assetFilter: AssetFilter
  onAssetFilterChange: (value: AssetFilter) => void
}) {
  return (
    <div className="rundown-filter-bar">
      <div className="filter-group">
        <span className="filter-group-label">Ready</span>
        {READY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`filter-pill${readyFilter === opt.value ? ' active' : ''}`}
            onClick={() => onReadyFilterChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="filter-group">
        <span className="filter-group-label">Assets</span>
        {ASSET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`filter-pill${assetFilter === opt.value ? ' active' : ''}`}
            onClick={() => onAssetFilterChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
