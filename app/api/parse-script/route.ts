import { NextRequest, NextResponse } from "next/server"
import { parseScriptText } from "@/lib/scriptParser"

function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.type === "application/x-pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  )
}

function isTxt(file: File): boolean {
  return (
    file.type === "text/plain" ||
    file.type === "" ||
    file.name.toLowerCase().endsWith(".txt")
  )
}

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Erro ao receber o arquivo" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
  }

  if (!isPdf(file) && !isTxt(file)) {
    return NextResponse.json(
      { error: `Tipo de arquivo não suportado (${file.type || "desconhecido"}). Use .txt ou .pdf` },
      { status: 400 }
    )
  }

  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 10 MB)" }, { status: 400 })
  }

  let text = ""

  try {
    if (isPdf(file)) {
      const { extractText } = await import("unpdf")
      const buffer = await file.arrayBuffer()
      const uint8 = new Uint8Array(buffer)
      const { text: extracted } = await extractText(uint8, { mergePages: false })
      // mergePages:false returns per-page strings with proper newlines; join with page break
      text = Array.isArray(extracted) ? extracted.join("\n\n") : extracted
    } else {
      text = await file.text()
    }
  } catch (err) {
    console.error("Erro ao extrair texto do arquivo:", err)
    return NextResponse.json(
      { error: "Não foi possível ler o arquivo. Tente exportar o PDF como texto ou cole o conteúdo diretamente." },
      { status: 422 }
    )
  }

  if (!text.trim()) {
    return NextResponse.json(
      { error: "O arquivo está vazio ou é um PDF escaneado (imagem). Cole o texto diretamente." },
      { status: 422 }
    )
  }

  const parsed = parseScriptText(text, file.name)

  if (parsed.characters.length === 0) {
    return NextResponse.json(
      { error: "Nenhum personagem detectado. Os nomes devem estar em MAIÚSCULAS em uma linha separada." },
      { status: 422 }
    )
  }

  return NextResponse.json(parsed)
}
