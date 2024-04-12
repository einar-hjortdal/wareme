import { describe, it, expect, mock } from 'bun:test'

import { EventEmitter } from './eventEmitter'

describe('EventEmitter', () => {
  it(('should add listeners'), () => {
    const eventEmitter = new EventEmitter()
    const mockListener0 = mock()
    const mockListener1 = mock()
    const mockListener2 = mock()

    eventEmitter.on(mockListener0)
    eventEmitter.on(mockListener1)
    eventEmitter.on(mockListener2)

    expect(eventEmitter.listenerCount()).toBeInteger(3)
  })

  it('should invoke listeners', () => {
    const eventEmitter = new EventEmitter()
    const mockListener = mock()

    // Add a regular listener
    eventEmitter.on(mockListener)

    // Emit an event
    eventEmitter.emit()

    // Check that the regular listener was called
    expect(mockListener).toHaveBeenCalledWith()
  })

  it('should invoke and remove once listeners', () => {
    const eventEmitter = new EventEmitter()
    const mockOnceListener = mock()

    // Add a once listener
    eventEmitter.once(mockOnceListener)

    // Emit an event
    eventEmitter.emit()

    // Check that the once listener was called
    expect(mockOnceListener).toHaveBeenCalledWith()

    // Emit another event to ensure the once listener was removed
    eventEmitter.emit('anotherEvent')

    // The once listener should not be called again
    expect(mockOnceListener).toHaveBeenCalledTimes(1)
  })

  const argsCases = [
    { args: [], expected: [] },
    { args: ['arg1'], expected: ['arg1'] },
    { args: ['arg1', 'arg2'], expected: ['arg1', 'arg2'] },
    { args: ['arg1', 'arg2', 'arg3'], expected: ['arg1', 'arg2', 'arg3'] },
    { args: ['arg1', 'arg2', 'arg3', 'arg4'], expected: ['arg1', 'arg2', 'arg3', 'arg4'] }
  ]
  it.each(argsCases)('should invoke one listener with varying numbers of arguments: %p', ({ args, expected }) => {
    const eventEmitter = new EventEmitter()
    const mockListener = mock()

    // Add listeners
    eventEmitter.on(mockListener)

    // Emit an event with the specified arguments
    eventEmitter.emit(...args)

    // Check that the listeners were called with the expected arguments
    expect(mockListener).toHaveBeenCalledWith(...expected)
  })

  it.each(argsCases)('should invoke one once listener with varying numbers of arguments: %p', ({ args, expected }) => {
    const eventEmitter = new EventEmitter()
    const mockOnceListener = mock()

    // Add listeners
    eventEmitter.once(mockOnceListener)

    // Emit an event with the specified arguments
    eventEmitter.emit(...args)

    // Check that the listeners were called with the expected arguments
    expect(mockOnceListener).toHaveBeenCalledWith(...expected)
  })
})
