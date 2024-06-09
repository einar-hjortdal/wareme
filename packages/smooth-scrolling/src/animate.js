import { detectIsEmpty } from '@dark-engine/core'
import { nisha } from '@wareme/utils'

import { damp, clamp } from './utils'

export class Animate {
  advance (deltaTime) {
    if (this.isRunning === false) {
      return
    }

    let completed = false

    if (this.lerp) {
      this.value = damp(this.value, this.to, this.lerp * 60, deltaTime)
      if (Math.round(this.value) === this.to) {
        this.value = this.to
        completed = true
      }
    } else {
      this.currentTime += deltaTime
      const linearProgress = clamp(0, this.currentTime / this.duration, 1)

      completed = linearProgress >= 1
      const easedProgress = nisha(completed, 1, () => this.easing(linearProgress))
      this.value = this.from + (this.to - this.from) * easedProgress
    }

    if (completed) {
      this.stop()
    }

    if (detectIsEmpty(this.onUpdate)) {
      return
    }
    this.onUpdate(this.value, completed)
  }

  // Stop the animation
  stop () {
    this.isRunning = false
  }

  // Oprional: lerp, duration, easing, onStart, onUpdate
  fromTo (from, to, { lerp, duration, easing, onStart, onUpdate }) {
    this.from = from
    this.value = from
    this.to = to
    this.lerp = lerp
    this.duration = duration
    this.easing = easing
    this.currentTime = 0
    this.isRunning = true
    this.onUpdate = onUpdate

    if (detectIsEmpty(onStart)) {
      return
    }
    onStart()
  }
}
