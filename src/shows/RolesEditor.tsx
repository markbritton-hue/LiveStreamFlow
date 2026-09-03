import { makeDefaultShowRoles, type ShowRole } from '../types'

export default function RolesEditor({
  roles,
  onChange,
}: {
  roles: ShowRole[]
  onChange: (roles: ShowRole[]) => void
}) {
  function update(id: string, patch: Partial<ShowRole>) {
    onChange(roles.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function remove(id: string) {
    onChange(roles.filter((r) => r.id !== id))
  }

  function add() {
    onChange([...roles, { id: crypto.randomUUID(), role: '', name: '' }])
  }

  if (roles.length === 0) {
    return (
      <div className="roles-editor">
        <p className="field-hint">No roles yet.</p>
        <div className="roles-editor-buttons">
          <button type="button" className="link-button" onClick={() => onChange(makeDefaultShowRoles())}>
            Add default film roles
          </button>
          <button type="button" className="link-button" onClick={add}>
            + Add role
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="roles-editor">
      {roles.map((r) => (
        <div key={r.id} className="roles-editor-row">
          <input
            className="roles-editor-role"
            placeholder="Role"
            value={r.role}
            onChange={(e) => update(r.id, { role: e.target.value })}
          />
          <input
            className="roles-editor-name"
            placeholder="Name"
            value={r.name}
            onChange={(e) => update(r.id, { name: e.target.value })}
          />
          <button
            type="button"
            className="delete-button"
            onClick={() => remove(r.id)}
            aria-label={`Remove ${r.role || 'role'}`}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="link-button" onClick={add}>
        + Add role
      </button>
    </div>
  )
}
