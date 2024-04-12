# Event emitter

High performance event emitter.

## Features

- Uses `@dark-engine/core` util functions
- Small bundle size
- Single events

## Usage

```js
import { EventEmitter } from '@wareme/event-emitter'

// Create a new instance
eventEmitter = new EventEmitter()

// Add a callback that will be invoked every time an event is emitted.
eventEmitter.on(callback)

// Add a callback that will be invoked the next time the event is fired, then it will be removed.
eventEmitter.once(callback)
// If a callback is not provided, a promise is returned
const newPromise = eventEmitter.once()
// A parameter can be provided, the number of millisecond will be used as timeout timer.
const timeoutPromise = eventEmitter.once(420)

// Remove a listener
eventEmitter.off(callback)
// Remove all listeners
eventEmitter.off()

// Emit an event, data may be attached to the event by passing it as parameter
eventEmitter.emit(data)
// More than one parameter can be passed to emit, fastest operation is achieved with 0-3 parameters.
eventEmitter.emit(data, moreData, evenMoreData)

// Return the number of listeners
eventEmitter.listenerCount()
```