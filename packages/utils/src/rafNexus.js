import { detectIsEmpty } from "@dark-engine/core"

// RafNexus allows you to centralize requestAnimationFrame (rAF) calls in one async loop.
// 1. Create a single instance of RafNexus in your application and use it for all rAF needs `const rafNexus = new RafNexus()`
// 2. create a callback to be executed at every frame `const onFrame = (time, deltaTime) => {/* do stuff */}`
// 3. pass the callback to the RafNexus instance `const unsubscribe = rafNexus.add(onFrame, 0)`
// 4. unsubscribe from the RafNexus instance to keep the loop small
// Note: it uses web APIs, check if you're in a browser before creating an instance.
export class RafNexus {
  constructor() {
    this.callbacks = []
    this.now = performance.now()
    requestAnimationFrame(this.raf)
  }

  add (callback, priority) {
    if (detectIsEmpty(priority)) {
      priority = 0
    }
    const sortFn = (a, b) => a.priority - b.priority
    this.callbacks.push({ callback, priority })
    this.callbacks.sort(sortFn)

    return () => this.remove(callback)
  }

  remove (callback) {
    const filterFn = ({ callback: cb }) => callback !== cb
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
