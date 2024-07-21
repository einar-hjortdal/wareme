import { component } from '@dark-engine/core'
import { createRoot } from '@dark-engine/platform-browser'

import Example1 from './example-1'
import Example2 from './example-2'

const App = component(() => {
  return (
    <div>
      <h1>@wareme/currency-input</h1>
      <Example1 />
      <Example2 />
    </div>
  )
})

createRoot(document.getElementById('dark-root')).render(<App />)
