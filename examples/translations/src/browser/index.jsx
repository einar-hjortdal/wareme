import { createRoot } from '@dark-engine/platform-browser'
import { Translator } from '@wareme/translations'

import { App } from '../shared/index.jsx'

const getMessages = async (lang) => {
  if (lang === 'no') {
    const messages = await import('../shared/messages/no.js')
    return messages.default
  }

  // fallback language
  const messages = await import('../shared/messages/en.js')
  return messages.default
}

const currentLanguage = document.documentElement.lang
const messages = await getMessages(currentLanguage)
const translator = new Translator(currentLanguage, messages)

createRoot(document.getElementById('dark-root')).render(<App translator={translator} />)
