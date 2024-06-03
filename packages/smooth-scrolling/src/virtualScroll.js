import { EventEmitter } from '@wareme/event-emitter'

const LINE_HEIGHT = 100 / 6

export class VirtualScroll {
  constructor(element, { wheelMultiplier = 1, touchMultiplier = 1 }) {
    this.element = element
    this.wheelMultiplier = wheelMultiplier
    this.touchMultiplier = touchMultiplier

    this.touchStart = { x: null, y: null }

    this.eventEmitter = new EventEmitter()

    window.addEventListener('resize', this.onWindowResize, false)
    this.onWindowResize()

    this.elementListenerOptions = { passive: false }
    this.element.addEventListener('wheel', this.onWheel, this.elementListenerOptions)
    this.element.addEventListener('touchstart', this.onTouchStart, this.elementListenerOptions)
    this.element.addEventListener('touchmove', this.onTouchMove, this.elementListenerOptions)
    this.element.addEventListener('touchend', this.onTouchEnd, this.elementListenerOptions)
  }

  on = (callback) => this.eventEmitter.on(callback)

  destroy = () => {
    window.removeEventListener('resize', this.onWindowResize, false)
    this.element.removeEventListener('wheel', this.onWheel, this.elementListenerOptions)
    this.element.removeEventListener('touchstart', this.onTouchStart, this.elementListenerOptions)
    this.element.removeEventListener('touchmove', this.onTouchMove, this.elementListenerOptions)
    this.element.removeEventListener('touchend', this.onTouchEnd, this.elementListenerOptions)
  }

  getTouchList = (event) => {
    if (event.targetTouches) {
      return event.targetTouches[0]
    }
    return event
  }

  onTouchStart = (event) => {
    const { clientX, clientY } = this.getTouchList(event)

    this.touchStart.x = clientX
    this.touchStart.y = clientY

    this.lastDelta = { x: 0, y: 0 }

    this.eventEmitter.emit({ deltaX: 0, deltaY: 0, event })
  }

  onTouchMove = (event) => {
    const { clientX, clientY } = this.getTouchList(event)

    const deltaX = -(clientX - this.touchStart.x) * this.touchMultiplier
    const deltaY = -(clientY - this.touchStart.y) * this.touchMultiplier

    this.touchStart.x = clientX
    this.touchStart.y = clientY

    this.lastDelta = { x: deltaX, y: deltaY }

    this.eventEmitter.emit({ deltaX, deltaY, event })
  }

  onTouchEnd = (event) => this.eventEmitter.emit({
    deltaX: this.lastDelta.x,
    deltaY: this.lastDelta.y, event
  })

  getMultipliers = (deltaMode) => {
    if (deltaMode === 1) {
      return [LINE_HEIGHT, LINE_HEIGHT]
    }
    if (deltaMode === 2) {
      return [this.windowWidth, this.windowHeight]
    }
    return [1, 1]
  }

  onWheel = (event) => {
    let { deltaX, deltaY, deltaMode } = event

    const [multiplierX, multiplierY] = this.getMultipliers(deltaMode)

    deltaX *= multiplierX
    deltaY *= multiplierY

    deltaX *= this.wheelMultiplier
    deltaY *= this.wheelMultiplier

    this.eventEmitter.emit({ deltaX, deltaY, event })
  }

  onWindowResize = () => {
    this.windowWidth = window.innerWidth
    this.windowHeight = window.innerHeight
  }
}
