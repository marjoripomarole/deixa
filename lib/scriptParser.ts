import type { ParsedScript, ScriptLine } from "@/types/script"

// Strip continuation annotations: "ANA (CONT.)" → "ANA", "LARA (V.O.)" → "LARA"
function normalizeCharacterName(name: string): string {
  return name
    .replace(/\s*\(CONT\.?\)/i, "")
    .replace(/\s*\(CONT'D\.?\)/i, "")
    .replace(/\s*\(V\.O\.?\)/i, "")
    .replace(/\s*\(O\.S\.?\)/i, "")
    .replace(/\s*\(OFF\)/i, "")
    .trim()
}

function isCharacterCue(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length > 60) return false

  // Normalize first to strip annotations before the all-caps check
  const normalized = normalizeCharacterName(trimmed)
  if (!normalized) return false

  // The base name must be all-caps
  if (normalized.toUpperCase() !== normalized) return false

  // Must contain at least one letter
  if (!/[A-ZÁÉÍÓÚÀÂÊÔÃÕÜÇÑ]/.test(normalized)) return false

  // Reject lines that look like sentences (multiple words ending with period, not annotations)
  const withoutAnnotations = trimmed.replace(/\s*\([^)]*\)/g, "").trim()
  if (withoutAnnotations.endsWith(".") && withoutAnnotations.split(/\s+/).length > 3) return false

  return true
}

function isStageDirection(line: string): boolean {
  const t = line.trim()
  return (
    (t.startsWith("(") && t.endsWith(")")) ||
    (t.startsWith("[") && t.endsWith("]")) ||
    (t.startsWith("<") && t.endsWith(">"))
  )
}

export function parseScriptText(rawText: string, filename = ""): ParsedScript {
  // Normalize line endings and remove form-feed characters from PDF extraction
  const rawLines = rawText.replace(/\f/g, "\n").split("\n")
  const scriptLines: ScriptLine[] = []
  const characterSet = new Set<string>()

  let currentCharacter = ""
  let lineBuffer: string[] = []
  let idCounter = 0

  function flush() {
    if (!currentCharacter || lineBuffer.length === 0) return
    const text = lineBuffer.join(" ").trim()
    if (!text) return
    const isDir = isStageDirection(text)
    if (!isDir) characterSet.add(currentCharacter)
    scriptLines.push({
      id: `line-${idCounter++}`,
      character: currentCharacter,
      text,
      isStageDirection: isDir,
    })
    lineBuffer = []
  }

  for (const raw of rawLines) {
    const line = raw.replace(/\r/g, "").trimEnd()

    if (!line.trim()) {
      flush()
      continue
    }

    if (isCharacterCue(line)) {
      flush()
      currentCharacter = normalizeCharacterName(line.trim())
      continue
    }

    if (currentCharacter) {
      lineBuffer.push(line.trim())
    }
  }
  flush()

  // Clean up filename for title display
  const title = filename
    ? filename
        .replace(/\.(txt|pdf)$/i, "")
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "Roteiro sem título"

  return {
    title,
    characters: Array.from(characterSet).sort(),
    lines: scriptLines,
  }
}
