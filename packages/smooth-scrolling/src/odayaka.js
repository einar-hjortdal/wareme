import { EventEmitter } from '@wareme/event-emitter'
import { nisha } from '@wareme/utils'

import { Animate } from './animate'
import { Dimensions } from './dimensions'
import { clamp, modulo } from './utils'
import { VirtualScroll } from './virtualScroll'
import { detectIsEmpty, detectIsFunction, detectIsString } from '@dark-engine/core'

// Odayaka does the following:
// - listens to 'wheel' events
// - prevents 'wheel' event to prevent scroll
// - normalizes wheel delta
// - adds delta to targetScroll
// - animates scroll to targetScroll (smooth context)
// - if animation is not running, listens to 'scroll' events (native context)
export class Odayaka {
  __isScrolling = false
  __isStopped = false
  __isLocked = false
  time
  userData
  lastVelocity
  velocity
  direction
  options
  targetScroll
  animatedScroll
  constructor({
    wrapper = window,
    content = document.documentElement,
    eventsTarget = wrapper,
    smoothWheel = true,
    syncTouch = false,
    syncTouchLerp = 0.075,
    touchInertiaMultiplier = 35,
    duration,
    easing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    lerp = 0.1,
    infinite = false,
    orientation = 'vertical',
    gestureOrientation = 'vertical',
    touchMultiplier = 1,
    wheelMultiplier = 1,
    autoResize = true,
    prevent = false
  } = {}) {
    // if wrapper is html or body, fallback to window
    if (!wrapper || wrapper === document.documentElement || wrapper === document.body) {
      wrapper = window
    }

    this.options = {
      wrapper, // Element to use as the scroll container
      content, // Element that contains the content that will be scrolled
      eventsTarget, // Element that listens to events
      smoothWheel, // Enable smooth scrolling for mouse wheel events
      syncTouch, // Mimic touch device scroll while allowing scroll sync
      syncTouchLerp, // Lerp applied during syncTouch inertia
      touchInertiaMultiplier, // Strength of syncTouch inertia
      duration, // The duration of scroll animation (in seconds)
      easing, // Function to use for the scroll animation
      lerp, // Linear interpolation intensity, overrides duration
      infinite, // Infinite scrolling, requires syncTouch on touch devices
      gestureOrientation, // Accepts 'vertical', 'horizontal' or 'both'
      orientation, // Accepts either 'vertical' or 'horizontal'
      touchMultiplier, // Used for touch events
      wheelMultiplier, // Used for mouse wheel events
      autoResize, // resize instance automatically based on `ResizeObserver`
      prevent // Prevent scroll to be smoothed according to elements traversed by events (node) =>  node.classList.contains('no-smooth-scrolling')
    }

    this.animate = new Animate()
    this.eventEmitter = new EventEmitter()
    this.dimensions = new Dimensions({ wrapper, content, autoResize })
    this.updateClassName()

    this.userData = {}
    this.time = 0
    this.velocity = this.lastVelocity = 0
    this.isLocked = false
    this.isStopped = false
    this.isScrolling = false
    this.targetScroll = this.animatedScroll = this.actualScroll

    this.options.wrapper.addEventListener('scroll', this.onNativeScroll, false)

    this.virtualScroll = new VirtualScroll(eventsTarget, {
      touchMultiplier,
      wheelMultiplier
    })
    this.virtualScroll.on(this.onVirtualScroll)
  }

  destroy () {
    this.options.wrapper.removeEventListener('scroll', this.onNativeScroll, false)
    this.virtualScroll.destroy()
    this.dimensions.destroy()
    this.cleanUpClassName()
  }

  on (callback) {
    return this.eventEmitter.on(callback)
  }

  off (callback) {
    return this.eventEmitter.off(callback)
  }

  setScroll (scroll) {
    // apply scroll value immediately
    if (this.isHorizontal) {
      this.rootElement.scrollLeft = scroll
    } else {
      this.rootElement.scrollTop = scroll
    }
  }

  onVirtualScroll = ({ deltaX, deltaY, event }) => {
    // keep zoom feature
    if (event.ctrlKey) {
      return
    }

    const isTouch = event.type.includes('touch')
    const isWheel = event.type.includes('wheel')

    this.isTouching = event.type === 'touchstart' || event.type === 'touchmove'

    const isTapToStop =
      this.options.syncTouch &&
      isTouch &&
      event.type === 'touchstart' &&
      !this.isStopped &&
      !this.isLocked

    if (isTapToStop) {
      this.reset()
      return
    }

    const isClick = deltaX === 0 && deltaY === 0 // click event

    const isUnknownGesture =
      (this.options.gestureOrientation === 'vertical' && deltaY === 0) ||
      (this.options.gestureOrientation === 'horizontal' && deltaX === 0)

    if (isClick || isUnknownGesture) {
      return
    }

    // catch if scrolling on nested scroll elements
    let composedPath = event.composedPath()
    composedPath = composedPath.slice(0, composedPath.indexOf(this.rootElement)) // remove parent elements

    const prevent = this.options.prevent

    if (
      // node instanceof Element &&
      Boolean(composedPath.find(
        (node) =>
          nisha(detectIsFunction(prevent), () => prevent(node), prevent) ||
          node.hasAttribute?.('data-odayaka-prevent') ||
          (isTouch && node.hasAttribute?.('data-odayaka-prevent-touch')) ||
          (isWheel && node.hasAttribute?.('data-odayaka-prevent-wheel')) ||
          (node.classList?.contains('odayaka') &&
            !node.classList?.contains('odayaka-stopped')) // nested instance
      ))
    ) {
      return
    }

    if (this.isStopped || this.isLocked) {
      event.preventDefault() // stop forwarding the event to the parent
      return
    }

    const isSmooth = (this.options.syncTouch && isTouch) || (this.options.smoothWheel && isWheel)

    if (!isSmooth) {
      this.isScrolling = 'native'
      this.animate.stop()
      return
    }

    event.preventDefault()

    let delta = deltaY
    if (this.options.gestureOrientation === 'both') {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        delta = deltaY
      } else {
        delta = deltaX
      }
    } else if (this.options.gestureOrientation === 'horizontal') {
      delta = deltaX
    }

    const syncTouch = isTouch && this.options.syncTouch
    const isTouchEnd = isTouch && event.type === 'touchend'

    const hasTouchInertia = isTouchEnd && Math.abs(delta) > 5

    if (hasTouchInertia) {
      delta = this.velocity * this.options.touchInertiaMultiplier
    }

    this.scrollTo(this.targetScroll + delta, {
      programmatic: false,
      ...nisha(syncTouch, {
        lerp: nisha(hasTouchInertia, this.options.syncTouchLerp, 1)
      }, {
        lerp: this.options.lerp,
        duration: this.options.duration,
        easing: this.options.easing
      })
    })
  }

  resize () {
    this.dimensions.resize()
  }

  emit () {
    this.eventEmitter.emit(this)
  }

  onNativeScroll = () => {
    clearTimeout(this.__resetVelocityTimeout)
    delete this.__resetVelocityTimeout

    if (this.__preventNextNativeScrollEvent) {
      delete this.__preventNextNativeScrollEvent
      return
    }

    if (this.isScrolling === false || this.isScrolling === 'native') {
      const lastScroll = this.animatedScroll
      this.animatedScroll = this.targetScroll = this.actualScroll
      this.lastVelocity = this.velocity
      this.velocity = this.animatedScroll - lastScroll
      this.direction = Math.sign(this.animatedScroll - lastScroll)
      this.isScrolling = 'native'
      this.emit()

      if (this.velocity !== 0) {
        this.__resetVelocityTimeout = setTimeout(() => {
          this.lastVelocity = this.velocity
          this.velocity = 0
          this.isScrolling = false
          this.emit()
        }, 400)
      }
    }
  }

  reset () {
    this.isLocked = false
    this.isScrolling = false
    this.animatedScroll = this.targetScroll = this.actualScroll
    this.lastVelocity = this.velocity = 0
    this.animate.stop()
  }

  start () {
    if (!this.isStopped) return
    this.isStopped = false

    this.reset()
  }

  stop () {
    if (this.isStopped) return
    this.isStopped = true
    this.animate.stop()

    this.reset()
  }

  raf (time) {
    const deltaTime = time - (this.time || time)
    this.time = time

    this.animate.advance(deltaTime * 0.001)
  }

  scrollTo (
    target,
    {
      offset = 0,
      immediate = false,
      lock = false,
      duration = this.options.duration,
      easing = this.options.easing,
      lerp = this.options.lerp,
      onStart,
      onComplete,
      force = false, // scroll even if stopped
      programmatic = true, // called from outside of the class
      userData = {}
    } = {}
  ) {
    if ((this.isStopped || this.isLocked) && !force) return

    // keywords
    if (detectIsString(target) && ['top', 'left', 'start'].includes(target)) {
      target = 0
    } else if (detectIsString(target) && ['bottom', 'right', 'end'].includes(target)) {
      target = this.limit
    } else {
      let node

      if (typeof target === 'string') {
        // CSS selector
        node = document.querySelector(target)
      } else if (target instanceof HTMLElement && target?.nodeType) {
        // Node element
        node = target
      }

      if (node) {
        if (this.options.wrapper !== window) {
          // nested scroll offset correction
          const wrapperRect = this.rootElement.getBoundingClientRect()
          offset -= this.isHorizontal ? wrapperRect.left : wrapperRect.top
        }

        const rect = node.getBoundingClientRect()

        target = (this.isHorizontal ? rect.left : rect.top) + this.animatedScroll
      }
    }

    if (typeof target !== 'number') return

    target += offset
    target = Math.round(target)

    if (this.options.infinite) {
      if (programmatic) {
        this.targetScroll = this.animatedScroll = this.scroll
      }
    } else {
      target = clamp(0, target, this.limit)
    }

    if (target === this.targetScroll) {
      return
    }

    this.userData = userData

    if (immediate) {
      this.animatedScroll = this.targetScroll = target
      this.setScroll(this.scroll)
      this.reset()
      this.preventNextNativeScrollEvent()
      this.emit()
      if (!detectIsEmpty(onComplete) && detectIsFunction(onComplete)) {
        onComplete(this)
      }
      this.userData = {}
      return
    }

    if (!programmatic) {
      this.targetScroll = target
    }

    this.animate.fromTo(this.animatedScroll, target, {
      duration,
      easing,
      lerp,
      onStart: () => {
        // started
        if (lock) this.isLocked = true
        this.isScrolling = 'smooth'
        onStart?.(this)
      },
      onUpdate: (value, completed) => {
        this.isScrolling = 'smooth'

        // updated
        this.lastVelocity = this.velocity
        this.velocity = value - this.animatedScroll
        this.direction = Math.sign(this.velocity)

        this.animatedScroll = value
        this.setScroll(this.scroll)

        if (programmatic) {
          // wheel during programmatic should stop it
          this.targetScroll = value
        }

        if (!completed) this.emit()

        if (completed) {
          this.reset()
          this.emit()
          if (!detectIsEmpty(onComplete) && detectIsFunction(onComplete)) {
            onComplete(this)
          }
          this.userData = {}

          // avoid emitting event twice
          this.preventNextNativeScrollEvent()
        }
      }
    })
  }

  preventNextNativeScrollEvent () {
    this.__preventNextNativeScrollEvent = true

    requestAnimationFrame(() => {
      delete this.__preventNextNativeScrollEvent
    })
  }

  get rootElement () {
    if (this.options.wrapper === window) {
      return document.documentElement
    }
    return this.options.wrapper
  }

  get limit () {
    return this.dimensions.limit[nisha(this.isHorizontal, 'x', 'y')]
  }

  get isHorizontal () {
    return this.options.orientation === 'horizontal'
  }

  get actualScroll () {
    // value browser takes into account
    return nisha(this.isHorizontal, this.rootElement.scrollLeft, this.rootElement.scrollTop)
  }

  get scroll () {
    return nisha(this.options.infinite, () => modulo(this.animatedScroll, this.limit), this.animatedScroll)
  }

  get isScrolling () {
    return this.__isScrolling
  }

  set isScrolling (value) {
    if (this.__isScrolling !== value) {
      this.__isScrolling = value
      this.updateClassName()
    }
  }

  get isStopped () {
    return this.__isStopped
  }

  set isStopped (value) {
    if (this.__isStopped !== value) {
      this.__isStopped = value
      this.updateClassName()
    }
  }

  get isLocked () {
    return this.__isLocked
  }

  set isLocked (value) {
    if (this.__isLocked !== value) {
      this.__isLocked = value
      this.updateClassName()
    }
  }

  get isSmooth () {
    return this.isScrolling === 'smooth'
  }

  get className () {
    let className = 'odayaka'
    if (this.isStopped) className += ' odayaka-stopped'
    if (this.isLocked) className += ' odayaka-locked'
    if (this.isScrolling) className += ' odayaka-scrolling'
    if (this.isScrolling === 'smooth') className += ' odayaka-smooth'
    return className
  }

  updateClassName () {
    this.cleanUpClassName()

    this.rootElement.className = `${this.rootElement.className} ${this.className}`.trim()
  }

  cleanUpClassName () {
    this.rootElement.className = this.rootElement.className
      .replace(/odayaka(-\w+)?/g, '')
      .trim()
  }
}
