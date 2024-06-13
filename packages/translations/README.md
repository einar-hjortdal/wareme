# translations

## Features

- High performance
- Small bundle size
- Isomorphic
- ICU message-like syntax
- Dynamic messages loading

## Usage

1. Add the package to your project
```bash
bun add @wareme/event-emitter @wareme/translations
```

2. Create a `Translator` instance
```js
import { Translator } from '@wareme/translations'

const currentLanguage = 'en'
const messages = {'notFound.title': 'This page does not exist'}
const translator = new Translator(currentLanguage, messages)
```

3. Add the context provider to your application and give it the instance
```js
import { component } from '@dark-engine/core'
import { Router } from '@dark-engine/web-router'

const App = component(({ currentPath, translator }) => {
  return (
    <TranslationsProvider translator={translator}>
      <Router routes={routes} url={currentPath}>
        {slot => slot}
      </Router>
    </TranslationsProvider>
  )
})
```

4. Retrieve the `t` function with the `useTranslations` hook inside of your components
```js
import { component } from '@dark-engine/core'
import { useTranslation } from '@wareme/translations'

const NotFound = component(() => {
  const { t } = useTranslation()
  return {t('notFound.title')} // This page does not exist
})

export default NotFound
```

5. Change language with the `changeLanguage` method
```js
import { component } from '@dark-engine/core'
import { useTranslation } from '@wareme/translations'

const messages = {'notFound.title': 'Deze pagina bestaat niet'}

const NotFound = component(() => {
  const { t, translator } = useTranslation()
  translator.changeLanguage('nl', nlMessages)
  return {t('notFound.title')} // Deze pagina bestaat niet
})

export default NotFound
```

### The `translator` instance

You can retrieve the translator instance with the `useTranslation` hook and use it in your components.

```js
import { component } from '@dark-engine/core'
import { useTranslation } from '@wareme/translations'

const OpeningHours = component(({ className }) => {
  const { t, translator } = useTranslation('openingHours')

  const dayOptions = { weekday: 'long' }
  const monday = translator.formatDate(new Date(2024, 0, 1), dayOptions)
  const tuesday = translator.formatDate(new Date(2024, 0, 2), dayOptions)
  const saturday = translator.formatDate(new Date(2024, 0, 6), dayOptions)
  const sunday = translator.formatDate(new Date(2024, 0, 7), dayOptions)

  const timeOptions = { hour: 'numeric', minute: '2-digit' }
  const time9 = translator.formatDate(new Date(2024, 0, 1, 9, 0, 0), timeOptions)
  const time12 = translator.formatDate(new Date(2024, 0, 1, 12, 0, 0), timeOptions)
  const time15 = translator.formatDate(new Date(2024, 0, 1, 15, 0, 0), timeOptions)
  const time19 = translator.formatDate(new Date(2024, 0, 1, 19, 0, 0), timeOptions)

  return (
    <div className={className}>
      <h3>{t('heading')}</h3>
      <span>{tuesday} - {saturday}</span><br />
      <span>
        {time9} - {time12}<br />
        {time15} - {time19}
      </span><br />
      <span>{sunday} - {monday}</span><br />
      <span>{t('closed')}</span>
    </div>
  )
})

export default OpeningHours
```

### The `Translate` component

```js
import { Translator, Translate } from '@wareme/translations'

const en = { 'translate.test': 'hello <italic>beautiful</italic> <bold>{what}</bold>'}
const translator = new Translator('en', en)

const TranslateExample = component(({ translator }) => {
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

TranslateExample({ translator: translatorEn }) // 'hello <i>beautiful</i> <strong>world</strong>'
```

### Dynamic locale data loading

1. Create a couple of functions to handle the loading of locale data.
```js
export async function getMessages (lang) {
  if (lang === 'it') {
    const messages = await import('./it.js')
    return messages.default
  }
  if (lang === 'nl') {
    const messages = await import('./nl.js')
    return messages.default
  }

  // fallback language
  const messages = await import('./en.js')
  return messages.default
}

export async function dynamicMessagesLoading (translations, lang) {
  const { changeLanguage, localeData } = translations
  // do not load anything if locale data was already loaded.
  for (let i = 0, len = localeData.length; i < len; i++) {
    if (localeData[i].language === lang) {
      return changeLanguage(lang)
    }
  }

  const messages = await getMessages(lang)
  changeLanguage(lang, messages)
}
```
2. Use this function

### Missing messages and fallback messages

When a message is missing from the messages object, `translator.translate` returns `options.defaultMessage` 
if provided, otherwise it will return the key of the message.

If you'd prefer for `translator.translate` to fallback to messages of one language that is known to 
be complete, you have to manually merge two messages objects and provide the result object to `translator`.

```js
import en from '../shared/translations/en.json';
import nl from '../shared/translations/nl.json';

function addFallbackMessages (messages, fallback) {
  const result = { ...messages }
  const fallbackKeys = Object.keys(fallback)
  for (let i = 0, len = fallbackKeys.length; i < len; i++) {
    if (!Object.prototype.hasOwnProperty.call(messages, fallbackKeys[i])) {
      result[fallbackKeys[i]] = fallback[fallbackKeys[i]]
    }
  }
  return result
}

const nlWithEnFallbacks = addFallbackMessages(nl, en)
```

## Notes

- Pull requests are welcome, look [here](./CONTRIBUTING.md).
