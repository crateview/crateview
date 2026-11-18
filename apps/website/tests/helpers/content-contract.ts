/** Compare technical inline identifiers and executable examples across translations. */
export function contentContract(text: string, slug: string) {
  const prose = text.replace(/^```[^\n]*\n[\s\S]*?^```/gm, '')
  const lines = slug === 'configuration' ? prose.split('\n') : [prose]
  const dateTokens = ['DD.MM.YYYY HH:mm', 'YYYY', 'MM', 'DD', 'HH', 'mm', 'ss', 'Z']
  return {
    identifiers: lines
      .flatMap((line) => {
        // Bracketed date literals are prose, unlike the format tokens on this line.
        const normalized =
          slug === 'configuration' && dateTokens.every((token) => line.includes('`' + token + '`'))
            ? line.replace(/`\[[^\]`\n]+\]`/g, '`[date literal]`')
            : line
        return [...normalized.matchAll(/`[^`\n]+`/g)].map(([value]) => value)
      })
      .sort(),
    fences: [...text.matchAll(/^```[^\n]*\n[\s\S]*?^```/gm)].map(([value]) => value),
  }
}
