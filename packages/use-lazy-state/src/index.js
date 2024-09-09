import { useCallback, useEffect, useRef, detectIsFunction } from '@dark-engine/core'

export const useLazyState = (initialValue, callback) => {
  const stateRef = useRef(initialValue)

  useEffect(() => {
    callback(initialValue, initialValue)
  }, [initialValue])

  const set = (value) => {
    if (detectIsFunction(value)) {
      const nextValue = value(stateRef.current)
      callback(nextValue, stateRef.current)
      stateRef.current = nextValue
      return
    }

    if (value !== stateRef.current) {
      callback(value, stateRef.current)
      stateRef.current = value
    }
  }

  const get = useCallback(() => stateRef.current, [])

  return [get, set]
}