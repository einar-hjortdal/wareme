// nishaho is a function that works exactly like an if/else-if/else statement, or two chained ternary operators.
// Just like nisha, all parameters are evaluated immediately, not conditionally.
// If conditionOne is met, returnOne is returned, otherwise conditionTwo is evaluated and if it is met, returnTwo is returned.
// If none of the conditions are met, the defaultReturn is returned.
export const nishaho = (
  defaultReturn,
  conditionOne,
  returnOne,
  conditionTwo,
  returnTwo
) => conditionOne ? returnOne : conditionTwo ? returnTwo : defaultReturn
