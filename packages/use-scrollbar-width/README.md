# use-scrollbar-width

Detects the width of the browser's scrollbar. Returns 0 on the server.

```js
import { useScrollbarWidth } from '@wareme/use-scrollbar-width'

const Header = component(() => {
  const scrollbarWidth = useScrollbarWidth()
  return <StyledHeader $scrollbarWidth={scrollbarWidth} />
})
```