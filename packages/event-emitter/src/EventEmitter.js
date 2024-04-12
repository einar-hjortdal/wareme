import { detectIsUndefined, detectIsArray, detectIsFunction } from '@dark-engine/core'

class EventListener {
  fn/*: (...args: Array<mixed>)=> mixed */
  once/*: boolean */
  constructor (fn/*: (...args: Array<mixed>)=> mixed */, once/*: ?boolean */) {
    this.fn = fn
    if (once === true) { // enforce boolean parameter
      this.once = true
    } else {
      this.once = false
    }
  }
}

function addEventListener (event/*: EventEmitter */, listener/*: EventListener */) {
  if (detectIsUndefined(event.internalListeners)) {
    event.internalListeners = listener
  } else if (detectIsArray(event.internalListeners)) {
    event.internalListeners.push(listener)
  } else {
    event.internalListeners = [event.internalListeners, listener]
  }
}

function rmFirstListenerInstance (eventEmitter/*: EventEmitter */, eventListener/*: EventListener */) {
  const lis/*: EventListener | EventListener[] | void | mixed */ = eventEmitter.internalListeners
  if (detectIsUndefined(lis)) {
    return
  }

  // $FlowExpectedError lis !detectIsUndefined
  if (lis.fn && lis === eventListener) {
    eventEmitter.internalListeners = undefined
  }

  if (detectIsArray(lis)) {
  // $FlowExpectedError detectIsArray
    for (let i = 0, len = lis.length; i < len; i++) {
      // $FlowExpectedError detectIsArray
      if (lis[i] === eventListener) {
        // $FlowExpectedError detectIsArray
        lis.splice(i, 1)
        break
      }
    }
    // $FlowExpectedError detectIsArray
    if (lis.length === 0) eventListener.internalListeners = undefined
  }
}

export class EventEmitter {
  static onceTimeoutErrorCreator/*: () => Error */ = () => {
    const err = new Error('Once listener timed out.')
    err.name = 'Timeout'
    return err
  }

  internalListeners/*: ?EventListener | EventListener[] */
  off (fn/*: ()=> mixed */)/*: void */ {
    const lis/*: EventListener | EventListener[] | void | mixed */ = this.internalListeners
    if (detectIsUndefined(lis)) {
      return
    }

    if (detectIsUndefined(fn)) {
      this.internalListeners = undefined
      return
    }

    // $FlowExpectedError lis !detectIsUndefined
    if (lis.fn && lis.fn === fn) {
      this.internalListeners = undefined
      return
    }

    const newLis/*: EventListener[] */ = []
    // $FlowExpectedError lis !detectIsUndefined
    for (let i = 0, len = lis.length; i < len; i++) {
      // $FlowExpectedError lis !detectIsUndefined
      if (lis[i].fn !== fn) newLis.push(lis[i])
    }
    this.internalListeners = newLis
  }

  listenerCount ()/*: number */ {
    if (detectIsUndefined(this.internalListeners)) {
      return 0
    }

    // $FlowExpectedError this.internalListeners !detectIsUndefined
    if (this.internalListeners.fn) {
      return 1
    }

    // $FlowExpectedError this.internalListeners !detectIsUndefined and !EventListener
    return this.internalListeners.length
  }

  on (fn/*: (...args: Array<mixed>)=> mixed */)/*: void */ {
    addEventListener(this, new EventListener(fn))
  }

  once (v/*: (...args: Array<mixed>)=> mixed */)/*: void | Promise<mixed> */ {
    if (detectIsFunction(v)) {
    // $FlowExpectedError v detectIsFunction
      addEventListener(this, new EventListener(v, true))
      return
    }

    if (v) {
      return new Promise((resolve, reject) => {
        let listener
        const timeout/*: TimeoutID */ = setTimeout(() => {
          rmFirstListenerInstance(this, listener)
          reject(EventEmitter.onceTimeoutErrorCreator())
          // $FlowExpectedError v !detectIsFunction
        }, v)
        addEventListener(
          this,
          (listener = new EventListener(function () {
            clearTimeout(timeout)
            resolve(arguments)
          }, true))
        )
      })
    } else {
      return new Promise(resolve => addEventListener(this, new EventListener(resolve, true)))
    }
  }

  emit (a1/*: mixed */, a2/*: mixed */, a3/*: mixed */)/*: void */ {
    const lis = this.internalListeners
    const len = arguments.length
    if (detectIsUndefined(lis)) {
      return
    }

    if (lis.fn) {
      if (lis.once) {
        this.internalListeners = undefined
      }
      if (len === 0) {
        return lis.fn()
      } else if (len === 1) {
        return lis.fn(a1)
      } else if (len === 2) {
        return lis.fn(a1, a2)
      } else if (len === 3) {
        return lis.fn(a1, a2, a3)
      } else {
        lis.fn.apply(null, Array.from(arguments))
      }
    } else {
      let args
      let l
      for (let i = 0, len = lis.length; i < len; i++) {
        l = lis[i]
        if (l.once === true) {
          lis.splice(i, 1)
          i--
          if (lis.length === 0) {
            this.internalListeners = undefined
          }
        }

        if (len === 0) {
          l.fn()
        } else if (len === 1) {
          l.fn(a1)
        } else if (len === 2) {
          l.fn(a1, a2)
        } else if (len === 3) {
          l.fn(a1, a2, a3)
        } else {
          l.fn.apply(null, args || (args = Array.from(arguments)))
        }
      }
    }
  }
}
