import { marked } from 'marked'

// Escape raw HTML in the source before handing it to marked, so any
// literal <script>/<img onerror> etc. in user-authored content renders as
// inert text instead of being parsed as HTML — markdown syntax (**, #, -)
// is plain punctuation and still works after escaping.
function escapeHtml(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function useMarkdown() {
  function render(content: string): string {
    return marked.parse(escapeHtml(content), { async: false }) as string
  }

  return { render }
}
