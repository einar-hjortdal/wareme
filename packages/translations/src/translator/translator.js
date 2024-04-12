// @flow
import { detectIsEmpty, detectIsString } from '@dark-engine/core'
import { EventEmitter } from '@wareme/event-emitter'
import { getTranslationParts } from './parser'

export class TranslationError extends Error {
  id/*: string */
  language/*: string */
  moreInfo/*: ?string */

  constructor(id /*: string */, language /*: string */, moreInfo/*: ?string */) {
    super(`Translation failed. id: ${id} language: ${language}`)
    this.id = id
    this.language = language
    this.moreInfo = moreInfo
  }
}

/*::
interface LocaleData {
  language: string;
  messages: {[string]: string};
}

type FormatMessageOptions = Record<string, any> & { [key: string]: any };
*/

export class Translator {
  onError /*: (error: TranslationError) => void */
  localeData /*: Array<LocaleData> */
  currentLanguage/*: string */
  currentMessages/*: {[string]: string} */
  languageChangeEvents

  constructor(lang/*: string */, messages/*: {[string]: string} */, onError/*: (error: TranslationError)=>void */) {
    this.currentLanguage = lang

    if (detectIsEmpty(messages)) {
      throw new Error('`messages` should be provided when creating a new Translator instance')
    }

    if (detectIsEmpty(onError)) {
      this.onError = console.error
    } else {
      this.onError = onError
    }

    this.languageChangeEvents = new EventEmitter()
    // TODO handle when user provides LocaleData instead of messages (allow preloading multiple languages)
    this.localeData = [{
      language: lang,
      messages
    }]
    this.currentMessages = messages
  }

  // Allows to switch currentLanguage, if messages are provided they're loaded into localeData
  changeLanguage = (lang/*: string */, messages/*: ?{[string]: string} */)/*: void */ => {
    // Do not change language if already on the requested language
    if (this.currentLanguage === lang) {
      return
    }

    this.currentLanguage = lang
    if (detectIsEmpty(messages)) {
      let messagesFound = false
      for (let i = 0, len = this.localeData.length; i < len; i++) {
        if (this.localeData[i].language === lang) {
          this.currentMessages = this.localeData[i].messages
          messagesFound = true
        }
      }
      if (messagesFound === false) {
        this.onError('A language with no associated messages was selected.')
      }
      this.#emit()
      return
    }
    // $FlowExpectedError messages !isUndefined
    this.localeData = [...this.localeData, { language: lang, messages }]
    // $FlowExpectedError messages !isUndefined
    this.currentMessages = messages
    this.#emit()
  }

  formatDate = (value/*: Date */, options/*: FormatMessageOptions */)/*: string */ => {
    return new Intl.DateTimeFormat(this.currentLanguage, options).format(value)
  }

  formatNumber = (value/*: number */, options/*: FormatMessageOptions */)/*: string */ => {
    return new Intl.NumberFormat(this.currentLanguage, options).format(value)
  }

  #getMessage = (id/*: string */, options/*: ?FormatMessageOptions */, language /*: ?string */) /*: string | void */ => {
    let message
    if (detectIsEmpty(language)) {
      message = this.currentMessages[id]
    } else {
      const localeData = this.localeData
      for (let i = 0, len = localeData.length; i < len; i++) {
        if (localeData[i].language === language) {
          message = localeData[i].messages[id]
        }
      }
    }

    if (!detectIsString(message)) {
      this.onError(new TranslationError(id, this.currentLanguage))
      if (detectIsEmpty(options)) {
        return id
      }
      if (detectIsEmpty(options.defaultMessage)) {
        return id
      }
      return options.defaultMessage
    }
    return message
  }

  translate = (id/*: string */, options/*: ?FormatMessageOptions */, language /*: ?string */)/*: string */ => {
    const message = this.#getMessage(id, options, language)

    if (detectIsString(message)) {
      const lang = language || this.language
      try {
        // $FlowExpectedError message detectIsString, options !isUndefined
        return getTranslationParts(lang, message, options).join('')
      } catch (error) {
        this.onError(new TranslationError(id, this.currentLanguage))
      }
    }

    return String(message)
  }

  // Create a new function every time it is invoked.
  // This allows the custom hook to trigger rerenders.
  getFixedT = (idPrefix) => {
    const fixedT = (id, options, language) => {
      let resultId = id
      if (!detectIsEmpty(idPrefix)) {
        resultId = `${idPrefix}.${id}`
      }
      return this.translate(resultId, options, language)
    }
    return fixedT
  }

  onLanguageChanged = (callback/*: (...args: Array<mixed>)=> void */)/*: ()=> void */ => {
    return this.languageChangeEvents.on(callback)
  }

  offLanguageChanged = (listenerReference/*: (...args: Array<mixed>)=> void */)/*: ()=> void */ => {
    return this.languageChangeEvents.off(listenerReference)
  }

  #emit = () => {
    this.languageChangeEvents.emit()
  }
}
