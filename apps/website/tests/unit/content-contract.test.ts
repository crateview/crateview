import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contentContract } from '../helpers/content-contract'

const example =
  'Example: `DD.MM.YYYY HH:mm`. Tokens: `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss`, `Z`. Literal: `[at]`.'

describe('localized documentation technical contract', () => {
  it.each(['pt-BR', 'id', 'ru'])(
    'accepts the actual %s date literal without changing technical identifiers',
    (locale) => {
      const read = (code: string) =>
        readFileSync(
          new URL(`../../../../docs/${code}/docs/next/configuration.md`, import.meta.url),
          'utf8',
        )
      expect(contentContract(read(locale), 'configuration')).toEqual(
        contentContract(read('en'), 'configuration'),
      )
    },
  )
  it.each([
    ['format token', example.replace('`YYYY`', '`YY`')],
    ['format example', example.replace('DD.MM.YYYY HH:mm', 'DD.MM.YY HH:mm')],
    ['missing token', example.replace('`ss`, ', '')],
    ['environment variable', example + '\n`NUXT_PUBLIC_OTHER_DATE_FORMAT`'],
    ['literal outside date example', example + '\nElsewhere: `[às]`.'],
    ['fenced command', example + '\n```sh\ndocker compose down --volumes\n```'],
  ])('rejects a changed %s', (_label, changed) => {
    expect(contentContract(changed, 'configuration')).not.toEqual(
      contentContract(example, 'configuration'),
    )
  })
  it('does not normalize bracketed text in unrelated guides or paragraphs', () => {
    const translated = example.replace('[at]', '[às]')
    expect(contentContract(translated, 'installation')).not.toEqual(
      contentContract(example, 'installation'),
    )
    expect(contentContract('Literal: `[às]`.', 'configuration')).not.toEqual(
      contentContract('Literal: `[at]`.', 'configuration'),
    )
  })
})
