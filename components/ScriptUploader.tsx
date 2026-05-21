"use client"

import { useId, useState } from "react"
import type { ParsedScript } from "@/types/script"

interface Props {
  onParsed: (script: ParsedScript) => void
}

export default function ScriptUploader({ onParsed }: Props) {
  const inputId = useId()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState("")

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

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handlePasteSubmit() {
    if (!pasteText.trim()) return
    const blob = new Blob([pasteText], { type: "text/plain" })
    await handleFile(new File([blob], "roteiro.txt", { type: "text/plain" }))
  }

  if (pasteMode) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-charcoal">Cole o roteiro</p>
          <p className="text-xs text-charcoal/40">Nomes dos personagens em MAIÚSCULAS em uma linha separada</p>
        </div>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={"ANA\nOlá, tudo bem?\n\nLARA\nTudo ótimo!"}
          className="w-full h-52 rounded-xl border border-charcoal/15 bg-warm-white p-4 text-sm font-mono text-charcoal resize-none outline-none focus:border-wine/60 focus:ring-2 focus:ring-wine/10 transition-all placeholder:text-charcoal/20"
        />
        <div className="flex gap-2">
          <button
            onClick={() => { setPasteMode(false); setError("") }}
            className="flex-1 rounded-xl border border-charcoal/15 py-2.5 text-sm text-charcoal/60 hover:bg-charcoal/5 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteText.trim() || loading}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-cream bg-wine hover:bg-wine-dark disabled:opacity-40 transition-colors"
          >
            {loading ? "Analisando..." : "Analisar roteiro"}
          </button>
        </div>
        {error && <ErrorBox message={error} />}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <label
        htmlFor={inputId}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all
          ${dragging
            ? "border-wine bg-wine/5 scale-[1.01]"
            : "border-charcoal/20 hover:border-wine/50 hover:bg-wine/3"
          }`}
      >
        <div className="text-4xl mb-3 pointer-events-none select-none">📄</div>
        <p className="text-sm font-semibold text-charcoal pointer-events-none">
          {dragging ? "Solte aqui" : "Arraste o roteiro aqui"}
        </p>
        <p className="text-xs text-charcoal/40 mt-1 pointer-events-none">.txt ou .pdf • máx. 10 MB</p>
      </label>

      <input
        id={inputId}
        type="file"
        accept=".txt,.pdf,text/plain,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }}
      />

      {/* Primary upload button */}
      <label
        htmlFor={inputId}
        className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold text-cream bg-wine hover:bg-wine-dark cursor-pointer transition-colors shadow-md shadow-wine/20"
      >
        {loading
          ? <><span className="animate-spin inline-block">⏳</span> Analisando...</>
          : <>Selecionar arquivo</>
        }
      </label>

      <button
        onClick={() => setPasteMode(true)}
        className="w-full text-xs text-charcoal/40 hover:text-wine transition-colors py-1"
      >
        Ou cole o texto diretamente
      </button>

      {error && <ErrorBox message={error} />}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-wine/10 border border-wine/25 px-4 py-3 text-sm text-wine">
      ⚠️ {message}
    </div>
  )
}
