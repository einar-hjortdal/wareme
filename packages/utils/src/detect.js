import { keys } from '@dark-engine/core'

export const detectIsEmptyArray = (a) => a.length === 0
export const detectIsEmptyObject = (o) => keys(o).length === 0
export const detectIsEmptyString = (s) => s === ''
export const detectIsNaN = (o) => Number.isNaN(o)

export const detectIsObjectObject = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

export const detectIsPlainObject = (o) => {

  if (detectIsObjectObject(o) === false) {
    return false;
  }

  // Has modified constructor?
  const ctor = o.constructor;
  if (ctor === undefined) {
    return true;
  }

  // Has modified prototype?
  const prot = ctor.prototype;
  if (detectIsObjectObject(prot) === false) {
    return false;
  }

  // Does constructor have an Object-specific method?
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  return true;
};