"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import type { ParsedScript, ScriptLine } from "@/types/script"
import { speak, stop } from "@/lib/tts"
import { VOICES } from "@/lib/voices"

interface Props {
  script: ParsedScript
  playerCharacter: string
  onBack: () => void
}

function getPracticeLines(script: ParsedScript): ScriptLine[] {
  return script.lines.filter((l) => !l.isStageDirection && l.text.trim())
}

function assignVoices(characters: string[], playerCharacter: string): Record<string, string> {
  const others = characters.filter((c) => c !== playerCharacter)
  const map: Record<string, string> = {}
  others.forEach((char, i) => { map[char] = VOICES[i % VOICES.length].id })
  return map
}

export default function PracticeView({ script, playerCharacter, onBack }: Props) {
  const lines = getPracticeLines(script)
  const voiceMap = useMemo(() => assignVoices(script.characters, playerCharacter), [script.characters, playerCharacter])

  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [speechRate, setSpeechRate] = useState(1)
  const [autoPlay, setAutoPlay] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const current = lines[index]
  const isPlayerLine = current?.character === playerCharacter
  const progress = ((index + 1) / lines.length) * 100

  const playCurrentLine = useCallback(async () => {
    if (!current || isPlayerLine) return
    const voiceId = voiceMap[current.character] ?? VOICES[0].id
    setLoading(true); setSpeaking(true)
    await speak(current.text, voiceId, {
      rate: speechRate,
      onEnd: () => { setSpeaking(false); setLoading(false) },
      onError: () => { setSpeaking(false); setLoading(false) },
    })
    setLoading(false)
  }, [current, isPlayerLine, voiceMap, speechRate])

  useEffect(() => {
    setRevealed(false)
    if (autoPlay && current && !isPlayerLine) {
      const t = setTimeout(() => playCurrentLine(), 300)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, autoPlay])

  function next() {
    stop(); setSpeaking(false); setLoading(false); setRevealed(false)
    setIndex((i) => Math.min(i + 1, lines.length - 1))
  }
  function prev() {
    stop(); setSpeaking(false); setLoading(false); setRevealed(false)
    setIndex((i) => Math.max(i - 1, 0))
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "Enter") next()
      if (e.key === "ArrowLeft") prev()
      if (e.key === " ") { e.preventDefault(); isPlayerLine ? setRevealed((r) => !r) : playCurrentLine() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  if (!current) return null

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => { stop(); onBack() }}
          className="text-sm text-charcoal/40 hover:text-wine transition-colors">← Voltar</button>
        <span className="text-xs font-mono text-charcoal/40">{index + 1} / {lines.length}</span>
        <button onClick={() => setShowSettings((s) => !s)}
          className="text-sm text-charcoal/40 hover:text-wine transition-colors">⚙️ Ajustes</button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-charcoal/10">
        <div className="h-1.5 rounded-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="rounded-xl border border-gold/30 bg-warm-white p-4 space-y-3 text-sm">
          <label className="flex items-center justify-between">
            <span className="text-charcoal/70">Leitura automática</span>
            <button onClick={() => setAutoPlay((a) => !a)}
              className={`relative w-10 h-6 rounded-full transition-colors ${autoPlay ? "bg-wine" : "bg-charcoal/20"}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-warm-white transition-transform ${autoPlay ? "translate-x-4" : ""}`} />
            </button>
          </label>
          <div className="flex items-center justify-between gap-4">
            <span className="text-charcoal/70">Velocidade da voz</span>
            <div className="flex items-center gap-2">
              <input type="range" min={0.5} max={1.5} step={0.1} value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                className="w-24 accent-[#8B1E3F]" />
              <span className="text-charcoal/50 w-8">{speechRate.toFixed(1)}x</span>
            </div>
          </div>
          {script.characters.filter(c => c !== playerCharacter).length > 0 && (
            <div className="pt-1 border-t border-gold/20">
              <p className="text-xs font-medium text-charcoal/40 mb-2">Vozes atribuídas</p>
              {script.characters.filter(c => c !== playerCharacter).map((char) => (
                <div key={char} className="flex justify-between text-xs text-charcoal/60">
                  <span className="font-semibold">{char}</span>
                  <span>{VOICES.find(v => v.id === voiceMap[char])?.name ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Character label */}
      <div className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full w-fit border
        ${isPlayerLine
          ? "bg-wine/10 border-wine/35 text-wine"
          : "bg-charcoal/5 border-charcoal/15 text-charcoal/50"}`}>
        {current.character}{isPlayerLine && " (você)"}
      </div>

      {/* Line card */}
      <div className={`rounded-2xl border-2 p-8 min-h-[180px] flex flex-col justify-center gap-4
        ${isPlayerLine ? "border-wine/25 bg-wine/5" : "border-gold/30 bg-warm-white"}`}>
        {isPlayerLine ? (
          <>
            {revealed
              ? <p className="text-xl leading-relaxed font-medium text-charcoal">{current.text}</p>
              : (
                <div className="flex flex-wrap gap-1">
                  {current.text.split(" ").map((w, i) => (
                    <span key={i} className="inline-block rounded h-5 bg-wine/25 opacity-70"
                      style={{ width: `${Math.max(24, w.length * 9)}px` }} />
                  ))}
                </div>
              )}
            <button onClick={() => setRevealed((r) => !r)}
              className="self-start text-sm font-semibold text-wine hover:text-wine-dark underline transition-colors">
              {revealed ? "Ocultar fala" : "Revelar fala"}
            </button>
          </>
        ) : (
          <>
            <p className="text-xl leading-relaxed text-charcoal/80">{current.text}</p>
            <button onClick={playCurrentLine} disabled={speaking || loading}
              className="self-start flex items-center gap-2 text-sm font-semibold text-charcoal/50 hover:text-wine transition-colors disabled:opacity-40">
              {loading
                ? <><span className="animate-spin inline-block">⏳</span> Carregando voz...</>
                : speaking
                ? <><span className="animate-pulse">🔊</span> Reproduzindo...</>
                : <>🔊 Ouvir novamente</>}
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button onClick={prev} disabled={index === 0}
          className="flex-1 rounded-xl border border-gold/40 py-3 font-medium text-charcoal/60 hover:bg-warm-white disabled:opacity-30 transition-colors">
          ← Anterior
        </button>
        {index === lines.length - 1 ? (
          <button onClick={() => { setIndex(0); setRevealed(false) }}
            className="flex-1 rounded-xl bg-gold py-3 font-semibold text-warm-white hover:bg-[#b08930] transition-colors">
            Reiniciar 🎉
          </button>
        ) : (
          <button onClick={next}
            className="flex-1 rounded-xl bg-wine py-3 font-semibold text-warm-white hover:bg-wine-dark transition-colors">
            Próxima →
          </button>
        )}
      </div>

      <p className="text-center text-xs text-charcoal/30">← → navegar • Espaço: revelar / ouvir</p>
    </div>
  )
}
