import { component, useEffect } from '@dark-engine/core'
import { useLocation } from '@dark-engine/web-router'

const ScrollToTop = component(() => {
  const { pathname } = useLocation()
  useEffect(() => {
    document.documentElement.scrollTo({
      top: 0,
      left: 0
    })
  }, [pathname])
  return null
})

export default ScrollToTop
