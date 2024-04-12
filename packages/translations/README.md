# Dark translator

## Features

- High performance
- Small bundle size
- Isomorphic
- ICU message-like syntax
- Dynamic messages loading


### Setup

```js
import { Translator, TranslationsProvider } from '@wareme/translations'

import messages from './messages/en.js'
const translator = new Translator('en', messages)

<TranslationsProvider translator={translator}>
  <App />
<TranslationsProvider />
```

### Usage

TODO

```js
```

### Dynamic locale data loading

1. Create a couple of functions to handle the loading of locale data
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

TODO show example

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
