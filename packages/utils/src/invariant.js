import { illegal } from '@dark-engine/core'

const throwError = (errorMsg) => illegal(errorMsg, 'invariant')

export function invariant (condition, errorMsg) {
  if (condition) {
    return
  }

  // Bun evaluates this condition at bundle time and removes code below it
  if (process.env.BUN_ENV === 'production') {
    throwError('fail')
  }

  throwError(errorMsg)
}
