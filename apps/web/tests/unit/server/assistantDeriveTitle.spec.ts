import { describe, expect, it } from 'vitest'
import { deriveTitle } from '../../../server/services/assistant/title'

describe('deriveTitle', () => {
  it('uses the whole message when it is already short', () => {
    expect(deriveTitle('Come organizzo la settimana?')).toBe('Come organizzo la settimana?')
  })

  it('truncates a long message at a word boundary and adds an ellipsis', () => {
    const long = 'Puoi aiutarmi a preparare una lista di attività per il lancio del nuovo prodotto la prossima settimana?'
    const title = deriveTitle(long)
    expect(title.length).toBeLessThanOrEqual(50)
    expect(title.endsWith('…')).toBe(true)
    expect(title).not.toMatch(/\s…$/) // no dangling space before the ellipsis
  })

  it('collapses internal newlines/whitespace into single spaces', () => {
    expect(deriveTitle('Ciao\n\ncosa   puoi fare?')).toBe('Ciao cosa puoi fare?')
  })
})
