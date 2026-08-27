const API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY

export async function fetchDriveVideoDurationSeconds(fileId: string): Promise<number | null> {
  if (!API_KEY) return null

  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=videoMediaMetadata&key=${API_KEY}`,
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      videoMediaMetadata?: { durationMillis?: string }
    }
    const ms = data.videoMediaMetadata?.durationMillis
    return ms ? Number(ms) / 1000 : null
  } catch {
    return null
  }
}
