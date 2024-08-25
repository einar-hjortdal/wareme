import { keys } from "@dark-engine/core"
import { detectIsPlainObject } from "./detect"

export const hashKey = (queryKey) => {
  return JSON.stringify(queryKey, (_key, val) => {
    if (detectIsPlainObject(val)) {
      keys(val).sort().reduce((result, key) => {
        result[key] = val[key]
        return result
      }, {})
    }
    return val
  })
}
