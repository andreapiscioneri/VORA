// First message of a new conversation gets a title derived from it, for
// free — no extra AI call just to name the chat (see docs/AI.md).
export function deriveTitle(text: string): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= 48) return oneLine
  const cut = oneLine.slice(0, 48)
  const lastSpace = cut.lastIndexOf(' ')
  return `${lastSpace > 20 ? cut.slice(0, lastSpace) : cut}…`
}
