import { NextRequest, NextResponse } from "next/server"
import { VOICES } from "@/lib/voices"

const MODEL = "eleven_multilingual_v2"

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "TTS não configurado" }, { status: 500 })
  }

  const { text, voiceId } = await req.json() as { text: string; voiceId: string }

  if (!text?.trim() || !voiceId) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    console.error("ElevenLabs error:", err)
    return NextResponse.json({ error: "Erro no serviço de voz" }, { status: 502 })
  }

  // Stream the audio directly back to the client
  return new NextResponse(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  })
}
