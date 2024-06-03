import { describe, expect, test } from 'bun:test'

import { invariant } from './invariant'

describe('invariant', () => {
  test('Should throw error when condition evaluates to false', () => {
    expect(() => invariant(1 === 0, 'errorMsg')).toThrow()
  })
})
