import { describe, test, expect } from 'bun:test'
import { detectIsArray } from '@dark-engine/core'

import { Translator } from '../translator'

function noop () { }

const enLocaleData = {
  language: 'en',
  messages: {
    hello: 'Hello world',
    helloName: 'Hello, {name}',
    catNumber: '{num, plural, one {You have one cat.} other {You have {num} cats.}}',
    catZero: '{num, plural, 0 {You have no cats} one {You have one cat.} other {You have {num} cats.}}',
    catBroken: '{num, plural, one {You have one cat.} other {You have {{num} cats.}}}',
    notAString: 3
  }
}

const nlLocaleData = {
  language: 'nl',
  messages: {
    hello: 'Hallo wereld'
  }
}

describe('Translator constructor', () => {
  test('Should initialize instances correctly', () => {
    const translator = new Translator('en', enLocaleData.messages)
    expect(translator.currentLanguage).toBe('en')
    expect(translator.currentMessages).toBe(enLocaleData.messages)
    expect(detectIsArray(translator.localeData)).toBe(true)
    expect(translator.localeData.length).toBe(1)
  })
})

describe('translator.language', () => {
  test('Should switch languages', () => {
    const translator = new Translator('en', enLocaleData.messages)
    translator.changeLanguage('nl', nlLocaleData.messages)

    expect(translator.currentLanguage).toBe('nl')
    expect(translator.currentMessages).toBe(nlLocaleData.messages)
    expect(detectIsArray(translator.localeData)).toBe(true)
    expect(translator.localeData.length).toBe(2)

    translator.changeLanguage('en')
    expect(translator.currentLanguage).toBe('en')
    expect(translator.currentMessages).toBe(enLocaleData.messages)
    expect(detectIsArray(translator.localeData)).toBe(true)
    expect(translator.localeData.length).toBe(2)
  })
})

describe('translator.translate', () => {
  test('Should translate by id', () => {
    const { translate } = new Translator('en', enLocaleData.messages)

    expect(translate('hello')).toBe('Hello world')
  })

  test('Should return provided id on missing id', () => {
    const translator = new Translator('en', enLocaleData.messages)
    translator.onError = noop

    expect(translator.translate('missingId')).toBe('missingId')
  })

  test('Should return default message on missing id', () => {
    const translator = new Translator('en', enLocaleData.messages)
    translator.onError = noop

    expect(translator.translate('missingId', { defaultMessage: 'default' })).toBe('default')
  })

  test('Should process default message', () => {
    const translator = new Translator('en', enLocaleData.messages)
    translator.onError = noop

    expect(translator.translate('missingId', {
      defaultMessage: 'Velkommen til {by}',
      by: 'Smøla'
    }
    )).toBe('Velkommen til Smøla')
  })

  test('Should return provided id when message is not a string', () => {
    const translator = new Translator('en', enLocaleData.messages)
    translator.onError = noop

    expect(translator.translate('notAString')).toBe('notAString')
  })

  test('Should handle interpolation', () => {
    const { translate } = new Translator('en', enLocaleData.messages)

    expect(translate('helloName', { name: 'Eric' })).toBe('Hello, Eric')
  })

  test('Should handle plurals', () => {
    const { translate } = new Translator('en', enLocaleData.messages)

    // expect(translate('catZero', { num: 0 })).toBe('You have no cats.') // TODO does not handle 0
    expect(translate('catNumber', { num: 1 })).toBe('You have one cat.')
    expect(translate('catNumber', { num: 10 })).toBe('You have 10 cats.')
    // expect(translate('catBroken', { num: 10 })).toBe('You have 10 cats.') // errors, should emit useful error message
  })
})
