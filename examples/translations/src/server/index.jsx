import { join } from 'bun:path'
import Elysia from 'elysia'
import { component } from '@dark-engine/core'
import { renderToString } from '@dark-engine/platform-server'
import { Translator } from '@wareme/translations'

import { languages, defaultLanguage } from '../shared/messages/utils'
import en from '../shared/messages/en'
import no from '../shared/messages/no'
import { App } from '../shared'

const Page = component(({ currentLanguage }) => {
  return (
    <html lang={currentLanguage}>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <base href='/' />
        {/* Handle SEO here */}
        <link rel='shortcut icon' href='/favicon.ico' />
        <script type='module' src='/index.js' />
      </head>
      <body>
        <div id='dark-root'>___app</div>
      </body>
    </html>
  )
})

export const getLanguageFromPathname = (pathname) => {
  for (let i = 0, len = languages.length; i < len; i++) {
    const language = languages[i]
    if (pathname.startsWith(`/${language}`)) {
      return language
    }
  }
  return defaultLanguage
}

const getMessagesSync = (lang) => {
  if (lang === 'no') {
    return no
  }

  // fallback language
  return en
}

const darkResponse = async (elysiaContext) => {
  const currentPath = elysiaContext.path
  const currentLanguage = getLanguageFromPathname(currentPath)
  const messages = getMessagesSync(currentLanguage)
  const translator = new Translator(currentLanguage, messages)
  try {
    const app = await renderToString(
      <App
        currentPath={currentPath}
        translator={translator}
      />
    )
    const page = await renderToString(<Page currentLanguage={currentLanguage} />)
    const body = `<!DOCTYPE html>${page.replace('___app', app)}`
    elysiaContext.set.headers['Content-Type'] = 'text/html;charset=utf-8'
    return body
  } catch (err) {
    console.error(err)
  }
}

const handleResponse = async (elysiaContext) => {
  const absolutePath = join(process.cwd(), 'build/browser', elysiaContext.path)
  const file = Bun.file(absolutePath)
  const fileExists = await file.exists()
  if (fileExists) {
    return file
  }
  return darkResponse(elysiaContext)
}

new Elysia()
  .get('*', ctx => handleResponse(ctx))
  .on('start', () => console.log('Running on port 8420'))
  .listen(8420)
