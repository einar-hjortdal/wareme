import { keys } from "@dark-engine/core"
import { detectIsPlainObject } from "./detect"

export const hashKey = (queryKey) => {
  return JSON.stringify(queryKey, (_key, val) => {
    if (detectIsPlainObject(val)) {
      const sortedKeys = keys(val).sort()
      const result = []
      for (let i = 0, len = sortedKeys.length; i < len; i++) {
        const key = sortedKeys[i]
        result.push({ [key]: val[key] })
      }
      return result
    }
    return val
  })
}