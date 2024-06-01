// Sakkyuu allows you to centralize requestAnimationFrame (rAF) calls in one async loop.
// 1. Create a single instance of Sakkyuu in your application and use it for all rAF needs `const sakkyuu = new Sakkyuu()`
// 1. create a callback to be executed at every frame `const onFrame = (time, deltaTime) => {/* do stuff */}`
// 2. pass the callback to the Sakkyuu instance `const unsubscribe = sakkyuu.add(onFrame, 0)`
// 3. unsubscribe from the Sakkyuu instance to keep the loop small
// Note: it uses web APIs, check if you're in a browser before creating an instance.
export class Sakkyuu {
  constructor() {
    this.callbacks = []
    this.now = performance.now()
    requestAnimationFrame(this.raf)
  }

  add (callback, priority) {
    if (detectIsEmpty(priority)) {
      priority = 0
    }
    this.callbacks.push({ callback, priority })
    this.callbacks.sort((a, b) => a.priority - b.priority)

    return () => this.remove(callback)
  }

  remove (callback) {
    this.callbacks = this.callbacks.filter(({ callback: cb }) => callback !== cb)
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
