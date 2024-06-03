// nisha is a function that works similarly to a ternary operator.
// The main difference between nisha and a ternary operator is that values are delayed in execution 
// until they are returned by nisha.
export const nisha = (condition, truthyValue, falsyValue) => condition ? truthyValue : falsyValue
