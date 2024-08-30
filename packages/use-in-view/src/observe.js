import { detectIsFalsy, detectIsNumber, detectIsUndefined } from '@dark-engine/core'

const observerMap = new Map()
const RootIds = new WeakMap()
let rootId = 0
let unsupportedValue

// defaultFallbackInView defines the default behavior if the IntersectionObserver is unsupported.
// - `undefined`: Throw an error
// - `true` or `false`: Set the `inView` value to this regardless of intersection state
export const defaultFallbackInView = (inView) => {
  unsupportedValue = inView
}

// getRootId generates a unique ID for the root element
const getRootId = (root) => {
  if (detectIsFalsy(root)) {
    return '0'
  }

  if (RootIds.has(root)) {
    return RootIds.get(root)
  }

  rootId++
  RootIds.set(root, rootId.toString())
  return RootIds.get(root)
}

// Convert the options to a string Id, based on the values.
// Ensures we can reuse the same observer when observing elements with the same options.
const optionsToId = (options) => {
  const isKeyOfOptions = (key) => {
    return !detectIsUndefined(options[key])
  }

  const formatKey = (key) => {
    let value = options[key]
    if (key === 'root') {
      value = getRootId(options.root)
    }
    return `${key}_${value}`
  }

  return Object.keys(options)
    .sort()
    .filter(isKeyOfOptions)
    .map(formatKey)
    .toString()
}

const createObserver = (options) => {
  // Create a unique ID for this observer instance, based on the root, root margin and threshold.
  const id = optionsToId(options)
  let instance = observerMap.get(id)

  if (detectIsFalsy(instance)) {
    // Create a map of elements this observer is going to observe.
    // Each element has a list of callbacks that should be triggered, once it comes into view.
    const elements = new Map()
    let thresholds
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // While it would be nice if you could just look at isIntersecting to determine if the component is inside the viewport, browsers can't agree on how to use it.
        // Firefox ignores `threshold` when considering `isIntersecting`, so it will never be false again if `threshold` is > 0
        const inView =
          entry.isIntersecting &&
          thresholds.some(threshold => entry.intersectionRatio >= threshold)

        elements.get(entry.target)?.forEach(callback => {
          callback(inView, entry)
        })
      })
    }, options)

    // Ensure we have a valid thresholds array. If not, use the threshold from the options
    thresholds =
      observer.thresholds ||
      (Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold || 0])

    instance = { id, observer, elements }
    observerMap.set(id, instance)
  }

  return instance
}

export const observe = (element, callback, options, fallbackInView) => {
  if (detectIsUndefined(options)) {
    options = {}
  }

  if (detectIsUndefined(fallbackInView)) {
    fallbackInView = unsupportedValue
  }

  if (detectIsUndefined(window.IntersectionObserver) && !detectIsUndefined(fallbackInView)) {
    const bounds = element.getBoundingClientRect()
    callback(fallbackInView, {
      isIntersecting: fallbackInView,
      target: element,
      intersectionRatio:
        detectIsNumber(options.threshold) ? options.threshold : 0,
      time: 0,
      boundingClientRect: bounds,
      intersectionRect: bounds,
      rootBounds: bounds
    })
    return () => { }
  }
  // An observer with the same options can be reused
  const { id, observer, elements } = createObserver(options)

  // Register the callback listener for this element
  const callbacks = elements.get(element) || []
  if (detectIsFalsy(elements.has(element))) {
    elements.set(element, callbacks)
  }

  callbacks.push(callback)
  observer.observe(element)

  const unobserve = () => {
    // Remove the callback from the callback list
    callbacks.splice(callbacks.indexOf(callback), 1)

    if (callbacks.length === 0) {
      // No more callback exists for element, so destroy it
      elements.delete(element)
      observer.unobserve(element)
    }

    if (elements.size === 0) {
      // No more elements are being observer by this instance, so destroy it
      observer.disconnect()
      observerMap.delete(id)
    }
  }
  return unobserve
}
