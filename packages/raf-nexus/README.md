# raf-nexus

RafNexus allows you to centralize requestAnimationFrame calls in one async loop. RafNexus is highly 
optimized for performance.

## Usage

1. Create a single instance of RafNexus in your application and use it for all rAF needs `const rafNexus = new RafNexus()`
2. create a callback to be executed at every frame `const onFrame = (time, deltaTime) => {/* do stuff */}`
3. pass the callback to the RafNexus instance `const unsubscribe = rafNexus.add(onFrame, 0)`
4. unsubscribe from the RafNexus instance to keep the loop small

Note: it uses web APIs, remember to check if you're in a browser before creating an instance.

```js
import { detectIsBrowser } from '@dark-engine/platform-browser'
import { RafNexus } from '@wareme/raf-nexus'

const getRafNexus = () => {
  if (detectIsBrowser()) {
    return new RafNexus()
  }
  return null
}

const rafNexus = getRafNexus()
```

### RafNexusProvider and useRafNexus

You can also wrap your applciation in `RafNexusProvider`, this will make the `RafNexus` instance available 
to all children through the `useRafNexus` hook.