import { describe, expect, it } from 'vitest'
import { resolveTheme, safeUrl } from '../../app/utils/configuration'
const defaults = {
  primary: 'red',
  neutral: 'zinc',
  radius: '0.5rem',
  fontFamily: 'Inter, system-ui, sans-serif',
}
describe('shared registry UI theme configuration', () => {
  it('uses red / zinc defaults and accepts runtime overrides', () => {
    expect(resolveTheme(defaults, {})).toEqual(defaults)
    expect(
      resolveTheme(defaults, {
        themePrimary: 'blue',
        themeNeutral: 'slate',
        themeRadius: '8px',
        themeFontFamily: 'system-ui',
      }),
    ).toEqual({ primary: 'blue', neutral: 'slate', radius: '8px', fontFamily: 'system-ui' })
  })
  it.each([
    { themePrimary: 'unknown' },
    { themeNeutral: 'red' },
    { themeRadius: 'calc(1rem)' },
    { themeFontFamily: 'sans-serif; color:red' },
  ])('rejects invalid CSS overrides %j', (overrides) => {
    expect(() => resolveTheme(defaults, overrides)).toThrow()
  })
  it('allows local and web branding URLs only', () => {
    expect(safeUrl('/branding/crateview-mark-256.png')).toBe('/branding/crateview-mark-256.png')
    expect(safeUrl('https://crateview.de')).toBe('https://crateview.de/')
    for (const url of [
      'javascript:alert(1)',
      '//elsewhere.invalid',
      'data:image/png;base64,AA',
      'bad url',
    ])
      expect(safeUrl(url)).toBe('')
  })
})
