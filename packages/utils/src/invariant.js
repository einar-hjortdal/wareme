import { formatErrorMsg } from '@dark-engine/core'

const formatInvariantError = (errorMsg) => formatErrorMsg(errorMsg, 'invariant')

export function invariant (condition, errorMsg) {
  if (condition) {
    return
  }

  // Bun evaluates this condition at bundle time and removes code below it
  if (process.env.BUN_ENV === 'production') {
    throw new Error(formatInvariantError('fail'))
  }

  throw new Error(formatInvariantError(errorMsg))
}
