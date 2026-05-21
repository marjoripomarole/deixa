"use client"

import { useState } from "react"
import type { ParsedScript } from "@/types/script"
import ScriptUploader from "@/components/ScriptUploader"
import CharacterSelector from "@/components/CharacterSelector"
import PracticeView from "@/components/PracticeView"

type Stage = "upload" | "select" | "practice"

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload")
  const [script, setScript] = useState<ParsedScript | null>(null)
  const [playerCharacter, setPlayerCharacter] = useState("")

  function handleParsed(s: ParsedScript) { setScript(s); setStage("select") }
  function handleCharacterSelect(char: string) { setPlayerCharacter(char); setStage("practice") }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="border-b border-gold/30 bg-warm-white px-6 py-4 flex items-center gap-3">
        <span className="text-2xl">🎭</span>
        <div>
          <h1 className="text-lg font-bold text-charcoal leading-tight">DecoraTexto</h1>
          <p className="text-xs text-charcoal/50">Seu assistente de memorização</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {stage === "upload" && (
          <div className="w-full max-w-xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-charcoal">Memorize suas falas</h2>
              <p className="text-charcoal/60">Importe seu roteiro e pratique com voz em português brasileiro</p>
            </div>
            <ScriptUploader onParsed={handleParsed} />
            <div className="rounded-xl bg-warm-white border border-gold/30 p-5 space-y-2 text-sm text-charcoal/70">
              <p className="font-semibold text-charcoal">Como usar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Envie seu roteiro em .txt ou .pdf</li>
                <li>Os nomes dos personagens devem estar em <strong>MAIÚSCULAS</strong></li>
                <li>Escolha o personagem que você vai interpretar</li>
                <li>O app lê as falas dos outros personagens em voz alta</li>
                <li>Suas falas ficam ocultas até você revelar</li>
              </ol>
            </div>
          </div>
        )}
        {stage === "select" && script && (
          <CharacterSelector script={script} onSelect={handleCharacterSelect} onBack={() => setStage("upload")} />
        )}
        {stage === "practice" && script && (
          <PracticeView script={script} playerCharacter={playerCharacter} onBack={() => setStage("select")} />
        )}
      </main>
    </div>
  )
}
