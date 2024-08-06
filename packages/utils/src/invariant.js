import { illegal } from '@dark-engine/core'

const throwError = (errorMsg) => illegal(errorMsg, 'invariant')

// invariant is meant to be used with Bun's `define`
// https://bun.sh/guides/runtime/define-constant
export function invariant (condition, errorMsg) {
  if (condition) {
    return
  }

  // Bun evaluates this condition at bundle time and removes code below it,
  // resulting in smaller production bundles.
  if (process.env.BUN_ENV === 'production') {
    throwError('fail')
  }

  throwError(errorMsg)
}
