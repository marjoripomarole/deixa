"use client"

import { useState } from "react"
import type { ParsedScript } from "@/types/script"
import ScriptUploader from "@/components/ScriptUploader"
import CharacterSelector from "@/components/CharacterSelector"
import PracticeView from "@/components/PracticeView"

type Stage = "upload" | "select" | "practice"

const STEPS = [
  { num: "01", label: "Envie o roteiro", sub: ".txt ou .pdf" },
  { num: "02", label: "Escolha seu papel", sub: "Nomes em MAIÚSCULAS" },
  { num: "03", label: "Ouça os outros", sub: "TTS em português" },
  { num: "04", label: "Revele as suas", sub: "Treine a memória" },
]

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload")
  const [script, setScript] = useState<ParsedScript | null>(null)
  const [playerCharacter, setPlayerCharacter] = useState("")

  function handleParsed(s: ParsedScript) { setScript(s); setStage("select") }
  function handleCharacterSelect(char: string) { setPlayerCharacter(char); setStage("practice") }

  return (
    <div className="min-h-screen flex flex-col bg-charcoal">

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-charcoal/80 backdrop-blur-md">
        <button
          onClick={() => setStage("upload")}
          className="flex items-center gap-2.5 group"
        >
          <span className="text-lg">🎭</span>
          <span className="font-display font-bold text-cream text-lg tracking-tight group-hover:text-gold transition-colors">
            DecoraTexto
          </span>
        </button>
        {stage !== "upload" && (
          <span className="text-xs tracking-widest text-cream/30 uppercase">
            {stage === "select" ? "Escolher personagem" : "Praticando"}
          </span>
        )}
      </header>

      <main className="flex-1 flex flex-col">

        {/* ── UPLOAD STAGE ── */}
        {stage === "upload" && (
          <>
            {/* Hero */}
            <section className="flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center">
              <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] text-gold/80 uppercase mb-10 border border-gold/25 rounded-full px-4 py-1.5">
                <span className="w-1 h-1 rounded-full bg-gold/60 inline-block" />
                Para atores brasileiros
              </div>

              <h1 className="font-display font-black text-cream leading-[0.95] tracking-tight mb-8"
                style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)" }}>
                Memorize<br />
                <span className="text-gold italic">suas falas.</span>
              </h1>

              <p className="text-cream/40 text-base max-w-xs leading-relaxed">
                Importe seu roteiro e pratique com voz em português brasileiro
              </p>
            </section>

            {/* Upload card */}
            <section className="px-4 pb-24 flex justify-center">
              <div className="w-full max-w-md">
                <div className="bg-cream rounded-2xl p-7 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
                  <ScriptUploader onParsed={handleParsed} />
                </div>
              </div>
            </section>

            {/* Steps */}
            <section className="border-t border-white/5 py-20 px-6">
              <div className="max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
                {STEPS.map((step) => (
                  <div key={step.num} className="flex flex-col gap-3">
                    <span className="font-display text-gold/40 text-sm font-bold tracking-widest">{step.num}</span>
                    <p className="text-cream/70 text-sm font-medium leading-snug">{step.label}</p>
                    <p className="text-cream/25 text-xs">{step.sub}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── SELECT STAGE ── */}
        {stage === "select" && script && (
          <div className="flex-1 flex items-center justify-center px-4 py-16">
            <CharacterSelector
              script={script}
              onSelect={handleCharacterSelect}
              onBack={() => setStage("upload")}
            />
          </div>
        )}

        {/* ── PRACTICE STAGE ── */}
        {stage === "practice" && script && (
          <div className="flex-1 flex items-center justify-center px-4 py-8">
            <PracticeView
              script={script}
              playerCharacter={playerCharacter}
              onBack={() => setStage("select")}
            />
          </div>
        )}

      </main>
    </div>
  )
}
