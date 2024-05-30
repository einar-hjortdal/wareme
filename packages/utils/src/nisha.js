import { formatErrorMsg } from '@dark-engine/core'

const formatNishaError = (errorMsg) => formatErrorMsg(errorMsg, 'nisha')

// nisha returns trueValue if conditionBool is true. It returns falseValue if conditionBool is false.
// conditionBool must be a boolean.
// trueValue and falseValue must have the same type.
export const nisha = (conditionBool, trueValue, falseValue) => {
  if (typeof conditionBool !== 'boolean') {
    throw new Error(formatNishaError('`conditionBool` must be a boolean'))
  }
  if (typeof trueValue !== typeof falseValue) {
    throw new Error(formatNishaError('`trueValue` `falseValue` must have matching type'))
  }
  if (conditionBool === true) {
    return trueValue
  }
  return falseValue
}
