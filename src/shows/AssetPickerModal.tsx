import { useState } from 'react'
import Modal from '../components/Modal'
import { getDriveFolderEmbedUrl } from '../types'

export default function AssetPickerModal({
  folderUrl,
  onSelect,
  onClose,
}: {
  folderUrl: string
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const [pastedUrl, setPastedUrl] = useState('')
  const embedUrl = getDriveFolderEmbedUrl(folderUrl)

  function handleUseLink() {
    if (!pastedUrl.trim()) return
    onSelect(pastedUrl.trim())
  }

  return (
    <Modal title="Assets Folder" onClose={onClose} size="large">
      <p className="asset-picker-hint">
        Browse the folder below, then right-click a file → <strong>Get link</strong>, or open it and
        copy its link — then paste it here.
      </p>

      {embedUrl ? (
        <iframe src={embedUrl} className="asset-picker-frame" title="Assets Folder" />
      ) : (
        <p>
          Couldn't read a folder link from the show's Assets Folder setting. Check it under Edit Show.
        </p>
      )}

      <div className="asset-picker-paste-row">
        <input
          type="url"
          placeholder="Paste the file link here"
          value={pastedUrl}
          onChange={(e) => setPastedUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUseLink()}
          autoFocus
        />
        <button type="button" onClick={handleUseLink} disabled={!pastedUrl.trim()}>
          Use Link
        </button>
      </div>
    </Modal>
  )
}
