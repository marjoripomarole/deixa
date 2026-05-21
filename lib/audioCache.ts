// Pre-generates and caches audio blobs from /api/tts so every line
// plays with zero latency. Generation runs 3 requests in parallel.

export type PreloadStatus = { total: number; loaded: number; done: boolean }

const cache = new Map<string, string>() // lineId → ObjectURL
let _status: PreloadStatus = { total: 0, loaded: 0, done: true }
const _listeners = new Set<(s: PreloadStatus) => void>()

function emit(s: PreloadStatus) {
  _status = s
  _listeners.forEach((fn) => fn(s))
}

export function getStatus(): PreloadStatus { return _status }

export function onStatus(fn: (s: PreloadStatus) => void): () => void {
  _listeners.add(fn)
  fn(_status)
  return () => _listeners.delete(fn)
}

export function getCachedUrl(lineId: string): string | null {
  return cache.get(lineId) ?? null
}

export function clearCache() {
  cache.forEach((url) => URL.revokeObjectURL(url))
  cache.clear()
  emit({ total: 0, loaded: 0, done: true })
}

export async function preloadLines(
  items: Array<{ id: string; text: string; voiceId: string }>
) {
  clearCache()
  if (!items.length) return

  const total = items.length
  let loaded = 0
  emit({ total, loaded: 0, done: false })

  const queue = [...items]

  async function worker(): Promise<void> {
    const item = queue.shift()
    if (!item) return

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: item.text, voiceId: item.voiceId }),
      })
      if (res.ok) {
        const blob = await res.blob()
        cache.set(item.id, URL.createObjectURL(blob))
      }
    } catch {
      // line stays uncached — speak() will generate on demand as fallback
    }

    loaded++
    emit({ total, loaded, done: loaded === total })
    await worker() // recurse until queue empty
  }

  const CONCURRENCY = 3
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, total) }, worker)
  )
}
