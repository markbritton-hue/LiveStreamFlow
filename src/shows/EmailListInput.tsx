import { useState, type KeyboardEvent } from 'react'

export default function EmailListInput({
  emails,
  onChange,
  placeholder,
}: {
  emails: string[]
  onChange: (emails: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')

  function commitDraft() {
    const value = draft.trim().replace(/,$/, '')
    if (value && !emails.includes(value)) {
      onChange([...emails, value])
    }
    setDraft('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitDraft()
    } else if (e.key === 'Backspace' && draft === '' && emails.length > 0) {
      onChange(emails.slice(0, -1))
    }
  }

  function removeEmail(email: string) {
    onChange(emails.filter((e) => e !== email))
  }

  return (
    <div className="email-list-input" onBlur={commitDraft}>
      {emails.map((email) => (
        <span key={email} className="email-chip">
          {email}
          <button type="button" onClick={() => removeEmail(email)} aria-label={`Remove ${email}`}>
            ✕
          </button>
        </span>
      ))}
      <input
        type="email"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
