import { detectIsServer, useRef } from '@dark-engine/core'

export const useScrollbarWidth = () => {
  if (detectIsServer()) {
    return 0
  }

  const didCompute = useRef(false)
  const widthRef = useRef(0)

  if (didCompute.current === true) {
    return widthRef.current
  }

  const outer = document.createElement('div')
  outer.style.visibility = 'hidden'
  outer.style.overflow = 'scroll'
  document.body.appendChild(outer)

  const inner = document.createElement('div')
  outer.appendChild(inner)

  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth
  outer.parentNode.removeChild(outer)

  didCompute.current = true
  widthRef.current = scrollbarWidth

  return scrollbarWidth
}
