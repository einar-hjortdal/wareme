import { formatErrorMsg } from '@dark-engine/core'

const throwError = (errorMsg) => {
  throw new Error(formatErrorMsg(errorMsg, 'nishaho'))
}

// nishaho always returns the defaultReturn value unless any of the conditions are met.
// If conditionOne is met, returnOne is returned, otherwise conditionTwo is evaluated and if it is met, returnTwo is returned.
// conditionOne and conditionTwo must be booleans
// defaultReturn, returnOne and returnTwo must have the same type.
export const nishaho = (defaultReturn, conditionOne, returnOne, conditionTwo, returnTwo) => {
  if (typeof conditionOne !== 'boolean' || typeof conditionTwo !== 'boolean') {
    throwError('`conditionOne` and `conditionTwo` must be boolean')
  }
  if (typeof defaultReturn !== typeof returnOne || typeof returnOne !== typeof returnTwo) {
    throwError('`defaultReturn`, `returnOne` and `returnTwo` must have matching type')
  }
  if (conditionOne) {
    return returnOne
  }
  if (conditionTwo) {
    return returnTwo
  }
  return defaultReturn
}