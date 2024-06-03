import { describe, expect, test } from 'bun:test'

import { nishaho } from './nishaho'

const defaultReturn = 'one'
const returnOne = 'two'
const returnTwo = 'three'
const truthyCondition = 0 === 0
const falsyCondition = 0 === 1

describe('nishaho', () => {
  test('Should return returnOne when conditionOne is truthy', () => {
    expect(nishaho(defaultReturn, truthyCondition, returnOne, truthyCondition, returnTwo)).toBe(returnOne)
  })
  test('Should return returnTwo when conditionOne is falsy and conditionTwo is truthy', () => {
    expect(nishaho(defaultReturn, falsyCondition, returnOne, truthyCondition, returnTwo)).toBe(returnTwo)
  })
  test('Should return defaultReturn when both conditionOne and conditionTwo are falsy', () => {
    expect(nishaho(defaultReturn, falsyCondition, returnOne, falsyCondition, returnTwo)).toBe(defaultReturn)
  })
})
