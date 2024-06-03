import { component } from "@dark-engine/core";
import { createGlobalStyle, styled } from "@dark-engine/styled"
import { createRoot } from "@dark-engine/platform-browser";
import { RafNexus } from "@wareme/raf-nexus";
import { SmoothScrollingProvider, useSmoothScrolling } from '@wareme/smooth-scrolling'

const rafNexus = new RafNexus()

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    overflow-y: hidden;
  }
`

// StyledSmoothScrollingProvider will implicitly pass a className to SmoothScrollingProvider
// You don't need to use @dark-engine/styled to style SmoothScrollingProvider, just pass it a className
const StyledSmoothScrollingProvider = styled(SmoothScrollingProvider)`
  max-height: 100vh;
  overflow-y: scroll;
`

const BigDiv = styled.div`
  background: linear-gradient(0deg, blue, green 40%, red);
  height: 300vh;
`

const Consumer = component(() => {
  const odayaka = useSmoothScrolling((e) => {
    console.log(e) // at every scroll event
  })
  console.log(odayaka)
  return (
    <BigDiv>
      some text
    </BigDiv>
  )
})

const App = component(() => {
  return (
    <>
      <GlobalStyle />
      <StyledSmoothScrollingProvider
        // root // uses html element
        rafNexus={rafNexus} // required
      // options // Odayaka options, described in odayaka.js
      // autoRaf // if false, odayaka.raf needs to be called manually
      // rafPriority // rafNexus execution priority
      >
        <Consumer />
      </StyledSmoothScrollingProvider>
    </>
  )
})

createRoot(document.getElementById('dark-root')).render(<App />);