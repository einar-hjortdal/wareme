import { EventEmitter } from '@wareme/event-emitter'
import { nishaho } from '@wareme/utils'

const LINE_HEIGHT = 100 / 6

export class VirtualScroll {
  constructor (element, { wheelMultiplier = 1, touchMultiplier = 1 }) {
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

  on (callback) {
    return this.eventEmitter.on(callback)
  }

  destroy () {
    window.removeEventListener('resize', this.onWindowResize, false)
    this.element.removeEventListener('wheel', this.onWheel, this.elementListenerOptions)
    this.element.removeEventListener('touchstart', this.onTouchStart, this.elementListenerOptions)
    this.element.removeEventListener('touchmove', this.onTouchMove, this.elementListenerOptions)
    this.element.removeEventListener('touchend', this.onTouchEnd, this.elementListenerOptions)
  }

  onTouchStart = (event) => {
    // event.targetTouches may be null or undefined if the browser doesn't support it
    const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event

    this.touchStart.x = clientX
    this.touchStart.y = clientY

    this.lastDelta = { x: 0, y: 0 }

    this.eventEmitter.emit({ deltaX: 0, deltaY: 0, event })
  }

  onTouchMove = (event) => {
    const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event

    const deltaX = -(clientX - this.touchStart.x) * this.touchMultiplier
    const deltaY = -(clientY - this.touchStart.y) * this.touchMultiplier

    this.touchStart.x = clientX
    this.touchStart.y = clientY

    this.lastDelta = { x: deltaX, y: deltaY }

    this.eventEmitter.emit({ deltaX, deltaY, event })
  }

  onTouchEnd = (event) => {
    this.eventEmitter.emit({ deltaX: this.lastDelta.x, deltaY: this.lastDelta.y, event })
  }

  onWheel = (event) => {
    let { deltaX, deltaY, deltaMode } = event

    const multiplierX = nishaho(1, deltaMode === 1, LINE_HEIGHT, deltaMode === 2, this.windowWidth)
    const multiplierY = nishaho(1, deltaMode === 1, LINE_HEIGHT, deltaMode === 2, this.windowHeight)

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
