import {
  useState,
  useRef,
  useEffect,
  detectIsEmpty,
  detectIsFalsy,
  detectIsArray
} from '@dark-engine/core'

import { observe } from './observe'

const alwaysString = (stringOrArray) => {
  if (detectIsArray(stringOrArray)) {
    return stringOrArray.toString()
  }
  return stringOrArray
}

export const useInView = (options) => {
  if (detectIsEmpty(options)) {
    options = {}
  }

  const {
    threshold,
    rootMargin,
    root,
    triggerOnce,
    skip,
    initialInView,
    fallbackInView,
    onChange
  } = options

  const [ref, setRef] = useState(null)
  const callback = useRef(onChange) // Access the latest instance inside the `useEffect`, no rerenders
  const [state, setState] = useState({
    inView: Boolean(initialInView),
    entry: undefined
  })

  useEffect(() => {
    if (skip || detectIsFalsy(ref)) {
      return
    }

    let unobserve
    unobserve = observe(
      ref,
      (inView, entry) => {
        setState({ inView, entry })

        if (callback.current) {
          callback.current(inView, entry)
        }

        if (entry.isIntersecting && triggerOnce && unobserve) {
          // If it should only trigger once, unobserve the element after it's inView
          unobserve()
          unobserve = undefined
        }
      },
      {
        root,
        rootMargin,
        threshold
      },
      fallbackInView
    )

    return () => {
      if (unobserve) {
        unobserve()
      }
    }
  }, [
    // If the threshold is an array, convert it to a string, so it won't change between renders.
    alwaysString(threshold),
    ref,
    root,
    rootMargin,
    triggerOnce,
    skip,
    fallbackInView
  ]
  )

  const entryTarget = state.entry?.target
  const previousEntryTarget = useRef()
  if (
    !ref &&
    entryTarget &&
    !triggerOnce &&
    !skip &&
    previousEntryTarget.current !== entryTarget
  ) {
    // If we don't have a node ref, then reset the state (unless the hook is set to only `triggerOnce` or `skip`)
    // This ensures we correctly reflect the current state - If you aren't observing anything, then nothing is inView
    previousEntryTarget.current = entryTarget
    setState({
      inView: Boolean(initialInView),
      entry: undefined
    })
  }

  return {
    ref: setRef,
    inView: state.inView,
    entry: state.entry
  }
}
