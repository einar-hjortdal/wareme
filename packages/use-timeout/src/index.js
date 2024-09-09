import { useEffect } from '@dark-engine/core'

export const useTimeout = (callback, delay, ...deps) => {
  useEffect(() => {
    const timeout = setTimeout(callback, delay)

    return () => {
      clearTimeout(timeout)
    }
  }, [delay, ...deps])
}