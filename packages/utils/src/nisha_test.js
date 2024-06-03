import { describe, expect, test } from 'bun:test'

import { nisha } from "./nisha";

const isTruthy = 'truthy'
const isFalsy = 'falsy'

describe('nisha', () => {
  test('Should return truthyValue when condition is truthy', () => {
    expect(nisha(1, isTruthy, isFalsy)).toBe(isTruthy)
  })
  test('Should return falsyValue when condition is falsy', () => {
    expect(nisha(0, isTruthy, isFalsy)).toBe(isFalsy)
  })
})
