import { detectIsUndefined } from '@dark-engine/core'

class InputStream {
  input/*: string */
  index = 0
  done = false
  value = ''

  constructor (input/*: string */) {
    this.input = input
    this.value = this.input.charAt(0)
  }

  next ()/*: string */ {
    if (++this.index >= this.input.length) {
      this.done = true
    }

    return (this.value = this.input.charAt(this.index))
  }

  croak () {
    throw new Error(`[${this.input}]. Unexpected character "${this.value}" on position ${this.index}.`)
  }
}

/*::
export type TokenType = 'Plural' | 'Select' | 'Text' | 'Variable'
export type TokenOptions = Record<string, Token[]>
// refactor TokenOptions

export interface Token {
  type: TokenType,
  value: string,
  options?: TokenOptions
}

type Predicate = (ch: string) => boolean;
*/

const OPEN = '{'
const CLOSE = '}'
const DELIMITER = ','

const PUNC_SYMBOLS = [OPEN, CLOSE, DELIMITER]
const PLURAL_IDENTIFIER = 'plural'
const SELECT_IDENTIFIER = 'select'

function isPunc (c/*: string */)/*: boolean */ {
  return PUNC_SYMBOLS.includes(c)
}

export class TokenStream {
  input/*: InputStream */

  constructor (message/*: string */) {
    this.input = new InputStream(message)
  }

  #skip (c/*: string */) {
    if (c !== this.input.value) {
      this.input.croak()
    }

    this.input.next()
  }

  #readWhile (predicate/*: Predicate */)/*: string */ {
    let str = ''

    while (!this.input.done && predicate(this.input.value)) {
      str += this.input.value
      this.input.next()
    }

    return str
  }

  #readVariableType ()/*: TokenType */ {
    const type = this.#readWhile(c => c !== DELIMITER).trim()

    if (type === PLURAL_IDENTIFIER) {
      return 'Plural'
    }

    if (type === SELECT_IDENTIFIER) {
      return 'Select'
    }

    this.input.croak()
  }

  #readVariableOptions ()/*: TokenOptions */ {
    this.#skip(DELIMITER)

    const options/*: TokenOptions */ = {}

    while (this.input.value !== CLOSE) {
      options[this.#readText().value.trim()] = this.#readExpression()
    }

    this.#skip(CLOSE)

    return options
  }

  #readExpression ()/*: Token[] */ {
    const tokens/*: Token[] */ = []

    this.#skip(OPEN)

    while (this.input.value !== CLOSE) {
      tokens.push(this.next())
    }

    this.#skip(CLOSE)

    return tokens
  }

  #readVariable ()/*: Token */ {
    this.#skip(OPEN)

    const value = this.#readWhile(c => !isPunc(c)).trim()

    if (value.length === 0) {
      this.input.croak()
    }

    if (this.input.value === CLOSE) {
      this.#skip(CLOSE)

      return {
        type: 'Variable',
        value
      }
    }

    this.#skip(DELIMITER)

    const type = this.#readVariableType()

    return {
      options: this.#readVariableOptions(),
      type,
      value
    }
  }

  #readText ()/*: Token */ {
    return {
      type: 'Text',
      value: this.#readWhile(c => c !== OPEN && c !== CLOSE)
    }
  }

  next ()/*: Token */ {
    if (this.input.value === OPEN) {
      return this.#readVariable()
    }

    return this.#readText()
  }
}

export function getTranslationParts (lang/*: string */, message/*: string */, params/*: Record<string, any> */) /*: any[] */{
  const tokenStream = new TokenStream(message)
  const result = []

  const applyToken = ({ options, type, value }/*: Token */) => {
    if (type === 'Variable') {
      result.push(params[value])
      return
    }

    if (detectIsUndefined(options)) {
      result.push(value)
      return
    }

    if (type === 'Select') {
      const optionTokens = options[params[value]] || options.other

      result.concat(optionTokens.map(applyToken))
      return
    }

    try {
      result.concat(
        options[new Intl.PluralRules(lang).select(params[value])].map(
          applyToken
        )
      )
    } catch (err) {
      result.concat(options.other.map(applyToken))
    }
  }

  while (!tokenStream.input.done) {
    applyToken(tokenStream.next())
  }

  return result
}
