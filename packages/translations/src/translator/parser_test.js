import { test, describe, expect } from 'bun:test'

import { TokenStream } from './parser'

describe('TokenStream', () => {
  test('Should return tokens', () => {
    const stream = new TokenStream('Hello {name}!')

    expect(stream.next()).toEqual({
      type: 'Text',
      value: 'Hello '
    })
    expect(stream.next()).toEqual({
      type: 'Variable',
      value: 'name'
    })
    expect(stream.next()).toEqual({
      type: 'Text',
      value: '!'
    })
    expect(stream.input.done).toEqual(true)
  })
})

describe('Read plural options', () => {
  test('Should return plural token', () => {
    const stream = new TokenStream('{count, plural, one {One, item} other {{count} ite,ms}}')
    const options = {}

    options.one = [
      {
        type: 'Text',
        value: 'One, item'
      }
    ]

    options.other = [
      {
        type: 'Variable',
        value: 'count'
      },
      {
        type: 'Text',
        value: ' ite,ms'
      }
    ]

    expect(stream.next()).toEqual({
      options,
      type: 'Plural',
      value: 'count'
    })
    expect(stream.input.done).toEqual(true)
  })

  test('Should throw error', () => {
    const stream = new TokenStream('{c,,}')

    expect(() => {
      stream.next()
    }).toThrowError()
  })

  test('Should throw error', () => {
    const stream = new TokenStream('{c,p,}')

    expect(() => {
      stream.next()
    }).toThrowError()
  })
})

describe('Read text', () => {
  test('Should correct read text', () => {
    const tokenStream = new TokenStream(' a ')

    expect(tokenStream.next()).toEqual({
      type: 'Text',
      value: ' a '
    })
    expect(tokenStream.input.done).toEqual(true)
  })

  test('Should correct read text', () => {
    const tokenStream = new TokenStream('a b ')

    expect(tokenStream.next()).toEqual({
      type: 'Text',
      value: 'a b '
    })
    expect(tokenStream.input.done).toEqual(true)
  })

  test('Should correct handle empty string', () => {
    const tokenStream = new TokenStream('')

    expect(tokenStream.next()).toEqual({
      type: 'Text',
      value: ''
    })
    expect(tokenStream.input.done).toEqual(true)
  })
})

describe('Read variable', () => {
  test('Should correct read variable', () => {
    const tokenStream = new TokenStream('{a}')

    expect(tokenStream.next()).toEqual({
      type: 'Variable',
      value: 'a'
    })
    expect(tokenStream.input.done).toEqual(true)
  })

  test('Should correct read variable', () => {
    const tokenStream = new TokenStream('{ a }')

    expect(tokenStream.next()).toEqual({
      type: 'Variable',
      value: 'a'
    })
    expect(tokenStream.input.done).toBeTruthy()
  })

  test('Should throw error for empty variable', () => {
    const tokenStream = new TokenStream('{}')

    expect(() => {
      tokenStream.next()
    }).toThrowError()
  })

  test('Should throw error for incorrect variable syntax', () => {
    const tokenStream = new TokenStream('{a{a}')

    expect(() => {
      tokenStream.next()
    }).toThrowError()
  })
})
