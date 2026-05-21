"use client"

import { useRef, useState } from "react"
import type { ParsedScript } from "@/types/script"

interface Props {
  onParsed: (script: ParsedScript) => void
}

export default function ScriptUploader({ onParsed }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError("")
    setLoading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/parse-script", { method: "POST", body: form })
      let data: Record<string, unknown>
      try {
        data = await res.json()
      } catch {
        setError("Resposta inválida do servidor. Tente novamente.")
        return
      }
      if (!res.ok) {
        setError((data.error as string) ?? "Erro ao processar arquivo")
        return
      }
      onParsed(data as unknown as ParsedScript)
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  async function handlePasteSubmit() {
    if (!pasteText.trim()) return
    setLoading(true)
    const blob = new Blob([pasteText], { type: "text/plain" })
    await handleFile(new File([blob], "roteiro.txt", { type: "text/plain" }))
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {!pasteMode ? (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-colors
              ${dragging ? "border-wine bg-wine/5" : "border-gold/40 hover:border-wine hover:bg-wine/5"}`}
          >
            <div className="text-5xl mb-4">📄</div>
            <p className="text-lg font-medium text-charcoal">Arraste o roteiro aqui</p>
            <p className="text-sm text-charcoal/50 mt-1">ou clique para selecionar</p>
            <p className="text-xs text-charcoal/40 mt-3">.txt ou .pdf • máx. 5 MB</p>
            <input ref={fileRef} type="file" accept=".txt,.pdf,text/plain,application/pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>
          <button onClick={() => setPasteMode(true)}
            className="w-full text-sm text-charcoal/50 hover:text-wine underline transition-colors">
            Ou cole o texto do roteiro diretamente
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"Cole o roteiro aqui...\n\nDica: os nomes dos personagens devem estar em MAIÚSCULAS\n\nEXEMPLO:\nMARIA\nOlá, tudo bem?\n\nJOÃO\nTudo ótimo, obrigado!"}
            className="w-full h-64 rounded-xl border border-gold/40 bg-warm-white p-4 text-sm font-mono text-charcoal resize-none outline-none focus:border-wine transition-colors placeholder:text-charcoal/30"
          />
          <div className="flex gap-2">
            <button onClick={() => setPasteMode(false)}
              className="flex-1 rounded-xl border border-gold/40 py-2 text-sm text-charcoal/70 hover:bg-warm-white transition-colors">
              Voltar
            </button>
            <button onClick={handlePasteSubmit} disabled={!pasteText.trim() || loading}
              className="flex-1 rounded-xl py-2 text-sm font-semibold text-warm-white bg-wine hover:bg-wine-dark disabled:opacity-40 transition-colors">
              Analisar roteiro
            </button>
          </div>
        </div>
      )}
      {loading && <div className="text-center text-sm text-charcoal/50 animate-pulse">Analisando roteiro...</div>}
      {error && (
        <div className="rounded-xl bg-wine/10 border border-wine/30 px-4 py-3 text-sm text-wine">{error}</div>
      )}
    </div>
  )
}
