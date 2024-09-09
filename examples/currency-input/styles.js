import { styled, createGlobalStyle } from '@dark-engine/styled'

export const GlobalStyle = createGlobalStyle`
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

  input.is-invalid {
    color: #cc241d;
  }
`

export const Container = styled.div`
  padding: 3rem 6rem;
`

export const ErrorMessage = styled.div`
  color: #cc241d;
`

export const HalfWidth = styled.div`
  display: inline-block;
  width: 50%;
  vertical-align: top;
`

export const Pre = styled.pre`
  margin: unset;
  background-color: #504945;
`