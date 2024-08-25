import { keys } from '@dark-engine/core'

export const detectIsEmptyArray = (a) => a.length === 0
export const detectIsEmptyObject = (o) => keys(o).length === 0
export const detectIsEmptyString = (s) => s === ''
export const detectIsNaN = (o) => Number.isNaN(o)