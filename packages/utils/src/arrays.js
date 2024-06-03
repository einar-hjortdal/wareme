export const detectIsEmptyArray = (a) => a.length === 0
export const detectIsEmptyObject = (o) => Object.keys(o).length === 0
export const xor = (a, b) => Boolean(a) && !b || Boolean(b) && !a