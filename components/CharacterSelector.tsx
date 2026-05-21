"use client"

import type { ParsedScript } from "@/types/script"

interface Props {
  script: ParsedScript
  onSelect: (character: string) => void
  onBack: () => void
}

export default function CharacterSelector({ script, onSelect, onBack }: Props) {
  const counts = script.characters.reduce<Record<string, number>>((acc, c) => {
    acc[c] = script.lines.filter((l) => l.character === c && !l.isStageDirection).length
    return acc
  }, {})

  return (
    <div className="w-full max-w-lg mx-auto space-y-10">

      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-[10px] tracking-[0.3em] text-gold/60 uppercase">Roteiro carregado</p>
        <h2 className="font-display font-bold text-cream text-3xl leading-tight">{script.title}</h2>
        <p className="text-cream/40 text-sm">Qual personagem você vai interpretar?</p>
      </div>

      {/* Character cards */}
      <div className="grid grid-cols-2 gap-3">
        {script.characters.map((char, i) => (
          <button
            key={char}
            onClick={() => onSelect(char)}
            className="group relative flex flex-col gap-2 rounded-2xl border border-white/8 bg-white/4 px-5 py-5 text-left transition-all duration-200 hover:border-wine/50 hover:bg-wine/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="font-mono text-[10px] tracking-widest text-gold/40 group-hover:text-gold/70 transition-colors">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-display font-bold text-cream text-xl leading-tight break-words">
              {char}
            </span>
            <span className="text-cream/30 text-xs group-hover:text-cream/50 transition-colors">
              {counts[char]} {counts[char] === 1 ? "fala" : "falas"}
            </span>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-wine/0 group-hover:text-wine/60 transition-all text-lg">→</span>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onBack}
          className="text-xs text-cream/25 hover:text-cream/60 transition-colors underline underline-offset-4"
        >
          Trocar roteiro
        </button>
      </div>
    </div>
  )
}
