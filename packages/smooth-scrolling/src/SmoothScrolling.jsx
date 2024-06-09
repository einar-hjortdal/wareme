import {
  component,
  useCallback,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  detectIsEmpty
} from '@dark-engine/core'

import { Odayaka } from './odayaka'
import { Store, useStore } from './store'

//
//
// Context
//
//

const OdayakaContext = createContext(null)

const rootOdayakaContextStore = new Store({})

const useCurrentOdayaka = () => {
  const localContext = useContext(OdayakaContext)
  const rootContext = useStore(rootOdayakaContextStore)

  if (detectIsEmpty(localContext)) {
    return rootContext
  }
  return localContext
}

export const useSmoothScrolling = (callback, deps = [], priority = 0) => {
  const { odayaka, addCallback, removeCallback } = useCurrentOdayaka()

  useEffect(() => {
    if (!callback || !addCallback || !removeCallback || odayaka !== null) {
      return
    }

    addCallback(callback, priority)
    callback(odayaka)

    return () => {
      removeCallback(callback)
    }
  }, [odayaka, addCallback, removeCallback, priority, ...deps])

  return odayaka
}

//
//
// Provider
//
//

export const SmoothScrollingProvider = component(({
  rafNexus,
  wrapperRef,
  contentRef,
  slot,
  root = false,
  options = {},
  autoRaf = true,
  rafPriority = 0,
  className,
  ...props
}) => {
  const getRef = (refProp) => {
    if (detectIsEmpty(refProp)) {
      return useRef(null)
    }
    return refProp
  }
  const wRef = getRef(wrapperRef)
  const cRef = getRef(contentRef)


  const [odayaka, setOdayaka] = useState(null)
  const callbacksRefs = useRef([])

  const addCallback = useCallback((callback, priority) => {
    const sortFn = (a, b) => a.priority - b.priority
    callbacksRefs.current.push({ callback, priority })
    callbacksRefs.current.sort(sortFn)
  }, [])

  const removeCallback = useCallback(callback => {
    const filterFn = (cb) => cb.callback !== callback
    callbacksRefs.current = callbacksRefs.current.filter(filterFn)
  }, [])

  useEffect(() => {
    const odayaka = new Odayaka({
      ...options, ...(!root && { wrapper: wRef.current, content: cRef.current })
    })

    setOdayaka(odayaka)

    return () => {
      odayaka.destroy()
      setOdayaka(null)
    }
  }, [root, JSON.stringify(options)])

  useEffect(() => {
    if (odayaka === null || autoRaf === false) {
      return
    }

    return rafNexus.add(time => {
      if (odayaka !== null) {
        odayaka.raf(time)
      }
    }, rafPriority)
  }, [odayaka, autoRaf, rafPriority])

  useEffect(() => {
    if (root && odayaka !== null) {
      rootOdayakaContextStore.set({ odayaka, addCallback, removeCallback })

      return () => rootOdayakaContextStore.set({})
    }
  }, [root, odayaka, addCallback, removeCallback])

  const onScroll = useCallback((...args) => {
    for (let i = 0, len = callbacksRefs.current.length; i < len; i++) {
      callbacksRefs.current[i].callback(...args)
    }
  }, [])

  useEffect(() => {
    if (odayaka !== null) {
      odayaka.on(onScroll)
    }

    return () => {
      if (odayaka !== null) {
        odayaka.off(onScroll)
      }
    }
  }, [odayaka, onScroll])

  if (root) {
    return <OdayakaContext value={{ odayaka, addCallback, removeCallback }}>{slot}</OdayakaContext>
  }

  return (
    <OdayakaContext value={{ odayaka, addCallback, removeCallback }}>
      <div ref={wRef} className={className} {...props}>
        <div ref={cRef}>{slot}</div>
      </div>
    </OdayakaContext>
  )
})
