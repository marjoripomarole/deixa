"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import type { ParsedScript, ScriptLine } from "@/types/script"
import { speak, stop } from "@/lib/tts"
import { VOICES } from "@/lib/voices"
import { preloadLines, clearCache, onStatus, type PreloadStatus } from "@/lib/audioCache"

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
  const [preload, setPreload] = useState<PreloadStatus>({ total: 0, loaded: 0, done: true })

  const current = lines[index]
  const isPlayerLine = current?.character === playerCharacter
  const progress = ((index + 1) / lines.length) * 100

  useEffect(() => {
    const nonPlayerLines = lines.filter((l) => l.character !== playerCharacter)
    const items = nonPlayerLines.map((l) => ({
      id: l.id,
      text: l.text,
      voiceId: voiceMap[l.character] ?? VOICES[0].id,
    }))
    const unsub = onStatus(setPreload)
    preloadLines(items)
    return () => { unsub(); clearCache() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const playCurrentLine = useCallback(async () => {
    if (!current || isPlayerLine) return
    const voiceId = voiceMap[current.character] ?? VOICES[0].id
    setLoading(true); setSpeaking(true)
    await speak(
      current.text, voiceId,
      { rate: speechRate, onEnd: () => { setSpeaking(false); setLoading(false) }, onError: () => { setSpeaking(false); setLoading(false) } },
      current.id,
    )
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
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">

      {/* Wine progress bar */}
      <div className="h-0.5 rounded-full bg-charcoal/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-wine transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Preload progress banner */}
      {!preload.done && (
        <div className="flex items-center gap-3 rounded-xl border border-wine/20 bg-wine/5 px-4 py-2.5">
          <div className="flex-1 h-1 rounded-full bg-charcoal/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-wine/50 transition-all duration-300"
              style={{ width: `${preload.total ? (preload.loaded / preload.total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-wine/60 shrink-0">
            Preparando vozes {preload.loaded}/{preload.total}
          </span>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <button onClick={() => { stop(); onBack() }}
          className="text-xs text-charcoal/35 hover:text-charcoal/70 transition-colors tracking-wide">
          ← Voltar
        </button>
        <span className="font-mono text-xs text-charcoal/25">{index + 1} / {lines.length}</span>
        <button onClick={() => setShowSettings((s) => !s)}
          className="text-xs text-charcoal/35 hover:text-charcoal/70 transition-colors">
          ⚙ Ajustes
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="rounded-2xl border border-charcoal/10 bg-warm-white p-5 space-y-4 text-sm shadow-sm">
          <label className="flex items-center justify-between">
            <span className="text-charcoal/60 text-xs tracking-wide">Leitura automática</span>
            <button
              onClick={() => setAutoPlay((a) => !a)}
              className={`relative w-10 h-5 rounded-full transition-colors ${autoPlay ? "bg-wine" : "bg-charcoal/15"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${autoPlay ? "translate-x-5" : ""}`} />
            </button>
          </label>
          <div className="flex items-center justify-between gap-4">
            <span className="text-charcoal/60 text-xs tracking-wide">Velocidade</span>
            <div className="flex items-center gap-3">
              <input type="range" min={0.5} max={1.5} step={0.1} value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                className="w-24 accent-[#8B1E3F]" />
              <span className="text-charcoal/40 text-xs w-8 tabular-nums">{speechRate.toFixed(1)}×</span>
            </div>
          </div>
          {script.characters.filter(c => c !== playerCharacter).length > 0 && (
            <div className="pt-3 border-t border-charcoal/8 space-y-2">
              <p className="text-[10px] tracking-widest text-charcoal/30 uppercase">Vozes atribuídas</p>
              {script.characters.filter(c => c !== playerCharacter).map((char) => (
                <div key={char} className="flex justify-between text-xs">
                  <span className="text-charcoal/60 font-semibold">{char}</span>
                  <span className="text-charcoal/35">{VOICES.find(v => v.id === voiceMap[char])?.name ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Character badge */}
      <div>
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full border
          ${isPlayerLine
            ? "border-wine/30 bg-wine/8 text-wine"
            : "border-charcoal/12 bg-charcoal/4 text-charcoal/45"
          }`}>
          {isPlayerLine && <span className="w-1 h-1 rounded-full bg-wine inline-block" />}
          {current.character}
          {isPlayerLine && " — você"}
        </span>
      </div>

      {/* Line card */}
      <div className={`rounded-2xl border-2 p-8 md:p-10 min-h-[200px] flex flex-col justify-center gap-5 transition-colors
        ${isPlayerLine
          ? "border-wine/20 bg-wine/5"
          : "border-charcoal/10 bg-warm-white shadow-sm"
        }`}>

        {isPlayerLine ? (
          <>
            {revealed ? (
              <p className="font-display text-2xl md:text-3xl leading-relaxed font-medium text-charcoal">
                {current.text}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 items-end">
                {current.text.split(" ").map((w, i) => (
                  <span key={i} className="inline-block rounded-md h-6 bg-wine/20"
                    style={{ width: `${Math.max(28, w.length * 10)}px` }} />
                ))}
              </div>
            )}
            <button onClick={() => setRevealed((r) => !r)}
              className="self-start text-xs font-semibold tracking-wide text-wine hover:text-wine-dark border border-wine/25 hover:border-wine/50 rounded-lg px-4 py-2 transition-all">
              {revealed ? "Ocultar fala" : "Revelar fala"}
            </button>
          </>
        ) : (
          <>
            <p className="font-display text-2xl md:text-3xl leading-relaxed text-charcoal/75">
              {current.text}
            </p>
            <button onClick={playCurrentLine} disabled={speaking || loading}
              className="self-start flex items-center gap-2 text-xs font-semibold tracking-wide text-charcoal/40 hover:text-wine border border-charcoal/12 hover:border-wine/30 rounded-lg px-4 py-2 transition-all disabled:opacity-30">
              {loading
                ? <><span className="animate-spin inline-block text-sm">⏳</span> Carregando...</>
                : speaking
                ? <><span className="animate-pulse text-sm">🔊</span> Reproduzindo...</>
                : <>🔊 Ouvir novamente</>}
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button onClick={prev} disabled={index === 0}
          className="flex-1 rounded-xl border border-charcoal/15 py-3.5 text-sm font-medium text-charcoal/50 hover:bg-charcoal/5 hover:text-charcoal/80 disabled:opacity-20 transition-all">
          ← Anterior
        </button>
        {index === lines.length - 1 ? (
          <button onClick={() => { setIndex(0); setRevealed(false) }}
            className="flex-1 rounded-xl bg-gold hover:bg-[#b08930] py-3.5 text-sm font-bold text-warm-white transition-colors">
            Reiniciar 🎉
          </button>
        ) : (
          <button onClick={next}
            className="flex-1 rounded-xl bg-wine hover:bg-wine-dark py-3.5 text-sm font-bold text-warm-white transition-colors">
            Próxima →
          </button>
        )}
      </div>

      <p className="text-center text-[10px] tracking-widest text-charcoal/20 uppercase">
        ← → navegar &nbsp;•&nbsp; Espaço: revelar / ouvir
      </p>
    </div>
  )
}
