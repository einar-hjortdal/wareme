import { component } from '@dark-engine/core'
import { styled, createGlobalStyle } from '@dark-engine/styled'
import { createRoot } from '@dark-engine/platform-browser'

import Example1 from './Example1'
import Example2 from './Example2'
import Example3 from './Example3'
import Example4 from './Example4'
import Example5 from './Example5'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    color: #ebdbb2;
    background-color: #1d2021;
    font-family: 'monospace';
    line-height: 1.5;
  }

  input,
  select {
    font-family: inherit;
    font-size: inherit;
  }
`

const Container = styled.div`
  padding: 3rem;
`

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
