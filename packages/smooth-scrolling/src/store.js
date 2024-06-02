import { useState, useEffect } from '@dark-engine/core'
import { EventEmitter } from '@wareme/event-emitter'

export class Store {
  state
  eventEmitter

  constructor (state) {
    this.state = state
    this.eventEmitter = new EventEmitter()
  }

  set (state) {
    this.state = state
    this.eventEmitter.emit(this.state)
  }

  on (callback) {
    this.eventEmitter.on(callback)
  }

  get () {
    return this.state
  }
}

export function useStore (store) {
  const [storeState, setStoreState] = useState(store.get())

  useEffect(() => {
    return store.on((newState) => setStoreState(newState))
  }, [storeState])

  return storeState
}
