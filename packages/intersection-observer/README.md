# Intersection Observer

Wrapper for the Observer API

## Usage

Assign the `ref` to the element you want to monitor, and the hook will report the status.

```js
import { component } from '@dark-engine/core'
import { useInView } from '@wareme/intersection-observer'

const Observed = component(() => {
  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 0,
  })

  return (
    <div ref={ref}>
      <h2>{`Header inside viewport ${inView}.`}</h2>
    </div>
  )
})
```

### Options

Provide these as the options for the `useInView` hook.

| Name                   | Type                      | Default     | Description                                                                                                                                                                                                                                                                                     |
|------------------------|---------------------------|-------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **root**               | `Element`                 | `document`  | The Intersection Observer interface's read-only root property identifies the Element or Document whose bounds are treated as the bounding box of the viewport for the element which is the observer's target. If the root is `null`, then the bounds of the actual document viewport are used.  |
| **rootMargin**         | `string`                  | `'0px'`     | Margin around the root. Can have values similar to the CSS margin property, e.g. `"10px 20px 30px 40px"` (top, right, bottom, left).                                                                                                                                                            |
| **threshold**          | `number` or `number[]`    | `0`         | Number between `0` and `1` indicating the percentage that should be visible before triggering. Can also be an array of numbers, to create multiple trigger points.                                                                                                                              |
| **onChange**           | `(inView, entry) => void` | `undefined` | Call this function whenever the in view state changes. It will receive the `inView` boolean, alongside the current `IntersectionObserverEntry`.                                                                                                                                                 |
| **skip**               | `boolean`                 | `false`     | Skip creating the IntersectionObserver. You can use this to enable and disable the observer as needed. If `skip` is set while `inView`, the current state will still be kept.                                                                                                                   |
| **triggerOnce**        | `boolean`                 | `false`     | Only trigger the observer once.                                                                                                                                                                                                                                                                 |
| **initialInView**      | `boolean`                 | `false`     | Set the initial value of the `inView` boolean. This can be used if you expect the element to be in the viewport to start with, and you want to trigger something when it leaves.                                                                                                                |
| **fallbackInView**     | `boolean`                 | `undefined` | If the `IntersectionObserver` API isn't available in the client, the default behavior is to throw an Error. You can set a specific fallback behavior, and the `inView` value will be set to this instead of failing. To set a global default, you can set it with the `defaultFallbackInView()` |
