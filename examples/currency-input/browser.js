import { component } from '@dark-engine/core'
import { createRoot } from '@dark-engine/platform-browser'

import { GlobalStyle, Container } from './styles'

import Example1 from './Example1'
import Example2 from './Example2'
import Example3 from './Example3'
import Example4 from './Example4'
import Example5 from './Example5'

const App = component(() => {
  return (
    <>
      <GlobalStyle />
      <Container>
        <h1>@wareme/currency-input</h1>
        <Example1 />
        <Example2 />
        <Example3 />
        <Example4 />
        <Example5 />
      </Container>
    </>
  )
})

createRoot(document.getElementById('dark-root')).render(<App />)
