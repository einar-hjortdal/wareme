import { useEffect, useState } from '@dark-engine/core'
import debounce from '@wareme/utils'

export const useWindowSize = (debounceDelay = 500) => {
  const [width, setWidth] = useState()
  const [height, setHeight] = useState()

  useEffect(() => {
    const onWindowRezise = debounce(() => {
      setWidth(Math.min(window.innerWidth, document.documentElement.clientWidth))
      setHeight(Math.min(window.innerHeight, document.documentElement.clientHeight))
    }, debounceDelay)

    window.addEventListener('resize', onWindowRezise, false)

    onWindowRezise()

    return () => window.removeEventListener('resize', onWindowRezise, false)
  }, [debounceDelay])

  return { width, height }
}