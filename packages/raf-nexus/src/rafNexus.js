import { detectIsEmpty } from '@dark-engine/core'

export class RafNexus {
  callbacks
  now

  constructor() {
    this.callbacks = []
    this.now = performance.now()
    requestAnimationFrame(this.raf)
  }

  add = (callback, priority) => {
    if (detectIsEmpty(priority)) {
      priority = 0
    }
    this.callbacks.push({ callback, priority })
    const sortFn = (a, b) => a.priority - b.priority
    this.callbacks.sort(sortFn)

    return () => this.remove(callback)
  }

  remove = (callbackToRemove) => {
    const filterFn = ({ callback: cb }) => callbackToRemove !== cb
    this.callbacks = this.callbacks.filter(filterFn)
  }

  raf = (now) => {
    requestAnimationFrame(this.raf)

    const deltaTime = now - this.now
    this.now = now

    for (let i = 0, len = this.callbacks.length; i < len; i++) {
      this.callbacks[i].callback(now, deltaTime)
    }
  }
}
