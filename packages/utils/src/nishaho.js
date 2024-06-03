// nishaho is a function that works exactly like an if/else-if/else statement
// If conditionOne is met, returnOne is returned, otherwise conditionTwo is evaluated and if it is met, returnTwo is returned.
// If none of the conditions are met, the defaultReturn is returned.
export const nishaho = (defaultReturn, conditionOne, returnOne, conditionTwo, returnTwo) => {
  if (conditionOne) {
    return returnOne
  }
  if (conditionTwo) {
    return returnTwo
  }
  return defaultReturn
}
