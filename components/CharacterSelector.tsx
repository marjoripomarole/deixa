"use client"

import type { ParsedScript } from "@/types/script"

interface Props {
  script: ParsedScript
  onSelect: (character: string) => void
  onBack: () => void
}

const CARDS = [
  "bg-wine/10 border-wine/40 text-wine hover:bg-wine/20",
  "bg-gold/10 border-gold/40 text-[#6b5218] hover:bg-gold/20",
  "bg-charcoal/8 border-charcoal/20 text-charcoal hover:bg-charcoal/12",
  "bg-wine/5 border-gold/30 text-wine-dark hover:bg-wine/10",
]

export default function CharacterSelector({ script, onSelect, onBack }: Props) {
  const counts = script.characters.reduce<Record<string, number>>((acc, c) => {
    acc[c] = script.lines.filter((l) => l.character === c && !l.isStageDirection).length
    return acc
  }, {})

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-charcoal">{script.title}</h2>
        <p className="text-charcoal/60 mt-1">Qual personagem você vai interpretar?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {script.characters.map((char, i) => (
          <button key={char} onClick={() => onSelect(char)}
            className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${CARDS[i % CARDS.length]}`}>
            <div className="font-bold text-sm">{char}</div>
            <div className="text-xs opacity-60 mt-0.5">
              {counts[char]} {counts[char] === 1 ? "fala" : "falas"}
            </div>
          </button>
        ))}
      </div>
      <button onClick={onBack}
        className="w-full text-sm text-charcoal/40 hover:text-wine underline transition-colors">
        Trocar roteiro
      </button>
    </div>
  )
}
