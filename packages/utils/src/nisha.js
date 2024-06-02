import { formatErrorMsg } from '@dark-engine/core'

const throwError = (errorMsg) => {
  throw new Error(formatErrorMsg(errorMsg, 'nisha'))
}

// nisha returns trueValue if conditionBool is true. It returns falseValue if conditionBool is false.
// conditionBool must be a boolean.
// trueValue and falseValue must have the same type.
export const nisha = (conditionBool, trueValue, falseValue) => {
  if (typeof conditionBool !== 'boolean') {
    throwError('`conditionBool` must be a boolean')
  }
  if (typeof trueValue !== typeof falseValue) {
    throwError('`trueValue` and `falseValue` must have matching type')
  }
  if (conditionBool) {
    return trueValue
  }
  return falseValue
}
