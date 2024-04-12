import { describe, test, expect } from 'bun:test'
import { component } from '@dark-engine/core'
import { renderToString } from '@dark-engine/platform-server'

import { Translator } from './translator'
import { TranslationsProvider } from './TranslationsProvider'
import { Translate } from './Translate'

// TODO ask how to do component testing
describe('server-rendered Translator', async () => {
  test('should correctly replace dummy-elements with actual elements', async () => {
    const en = {
      'translate.test': 'hello <italic>beautiful</italic> <bold>{what}</bold>'
    }
    const it = {
      'translate.test': 'ciao <italic>bel</italic> <bold>{what}</bold>'
    }

    const translatorEn = new Translator('en', en)
    const translatorIt = new Translator('it', it)

    const TranslatorTest = component(({ translator }) => {
      return (
        <TranslationsProvider translator={translator}>
          <Translate
            id='translate.test'
            // defaultMessage='hello <italic>beautiful</italic> <bold>{what}</bold>'
            values={{ what: 'world' }}
            elements={{
              italic: (chunk) => <i>{chunk}</i>,
              bold: (chunk) => <strong>{chunk}</strong>
            }}
          />
        </TranslationsProvider>
      )
    })

    const renderedEn = await renderToString(TranslatorTest({ translator: translatorEn }))
    expect(renderedEn).toBe('hello <i>beautiful</i> <strong>world</strong>')

    const renderedIt = await renderToString(TranslatorTest({ translator: translatorIt }))
    expect(renderedIt).toBe('ciao <i>bel</i> <strong>world</strong>')
  })

  test('should handle multiple of the same dummy-elements', async () => {
    const en = {
      'translate.test': 'hello <italic>beautiful</italic> <italic>world</italic> <italic>in</italic> <italic>italic</italic>'
    }

    const translatorEn = new Translator('en', en)

    const TranslatorTest = component(({ translator }) => {
      return (
        <TranslationsProvider translator={translator}>
          <Translate
            id='translate.test'
            values={{ what: 'world' }}
            elements={{
              italic: (chunk) => <i>{chunk}</i>,
              bold: (chunk) => <strong>{chunk}</strong>
            }}
          />
        </TranslationsProvider>
      )
    })

    const renderedEn = await renderToString(TranslatorTest({ translator: translatorEn }))
    expect(renderedEn).toBe('hello <i>beautiful</i> <i>world</i> <i>in</i> <i>italic</i>')
  })
})
