// ElevenLabs TTS via server-side proxy — key never exposed to browser

let currentAudio: HTMLAudioElement | null = null

export async function speak(
  text: string,
  voiceId: string,
  options?: { rate?: number; onEnd?: () => void; onError?: () => void }
) {
  stop()

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
  })

  if (!res.ok) {
    options?.onError?.()
    return
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)

  const audio = new Audio(url)
  audio.playbackRate = options?.rate ?? 1
  currentAudio = audio

  audio.onended = () => {
    URL.revokeObjectURL(url)
    currentAudio = null
    options?.onEnd?.()
  }
  audio.onerror = () => {
    URL.revokeObjectURL(url)
    currentAudio = null
    options?.onError?.()
  }

  await audio.play()
}

export function stop() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

export function isSpeaking(): boolean {
  return currentAudio !== null && !currentAudio.paused
}
