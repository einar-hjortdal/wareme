import {
  illegal,
  detectIsNull,
  detectIsObject,
  detectIsFunction,
  detectIsUndefined
} from '@dark-engine/core'

const throwError = (errorMsg) => illegal(errorMsg, 'debounce')

const isObject = (o) => !detectIsNull(o) && (detectIsObject(o) || detectIsFunction(o))

export const debounce = (func, wait, options) => {
  let lastArgs
  let lastThis
  let maxWait
  let result
  let timerId
  let lastCallTime
  let lastInvokeTime = 0
  let leading = false
  let maxing = false
  let trailing = true

  if (!detectIsFunction(func)) {
    throwError('Expected a function')
  }
  wait = +wait || 0
  if (isObject(options)) {
    leading = !!options.leading
    maxing = 'maxWait' in options
    maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait
    trailing = 'trailing' in options ? !!options.trailing : trailing
  }

  const invokeFunc = (time) => {
    const args = lastArgs
    const thisArg = lastThis

    lastArgs = lastThis = undefined
    lastInvokeTime = time
    result = func.apply(thisArg, args)
    return result
  }

  const startTimer = (pendingFunc, milliseconds) => {
    // TODO use RAF with RafNexus
    return setTimeout(pendingFunc, milliseconds)
  }

  const cancelTimer = (id) => {
    // TODO use RAF with RafNexus
    clearTimeout(id)
  }

  const leadingEdge = (time) => {
    // Reset any `maxWait` timer.
    lastInvokeTime = time
    // Start the timer for the trailing edge.
    timerId = startTimer(timerExpired, wait)
    // Invoke the leading edge.
    if (leading) {
      return invokeFunc(time)
    }
    return result
  }

  const remainingWait = (time) => {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall

    if (maxing) {
      return Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
    }
    return timeWaiting
  }

  const shouldInvoke = (time) => {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (
      detectIsUndefined(lastCallTime) ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxing && timeSinceLastInvoke >= maxWait)
    )
  }

  const timerExpired = () => {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    // Restart the timer.
    timerId = startTimer(timerExpired, remainingWait(time))
    return undefined
  }

  const trailingEdge = (time) => {
    timerId = undefined

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = lastThis = undefined
    return result
  }

  const cancel = () => {
    if (!detectIsUndefined(timerId)) {
      cancelTimer(timerId)
    }
    lastInvokeTime = 0
    lastArgs = lastCallTime = lastThis = timerId = undefined
  }

  const flush = () => {
    if (detectIsUndefined(timerId)) {
      return result
    }
    return trailingEdge(Date.now())
  }

  const pending = () => {
    return !detectIsUndefined(timerId)
  }

  function debounced (...args) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (detectIsUndefined(timerId)) {
        return leadingEdge(lastCallTime)
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = startTimer(timerExpired, wait)
        return invokeFunc(lastCallTime)
      }
    }
    if (detectIsUndefined(timerId)) {
      timerId = startTimer(timerExpired, wait)
    }
    return result
  }
  debounced.cancel = cancel
  debounced.flush = flush
  debounced.pending = pending
  return debounced
}
