import { css } from '@dark-engine/styled'

// Typical smooth scrolling styles 
export const SmoothScrollingStyles = css`
  html.odayaka, html.odayaka body {
    height: auto;
  }

  .odayaka.odayaka-smooth {
    scroll-behavior: auto !important;
  }

  .odayaka.odayaka-smooth [data-odayaka-prevent] {
    overscroll-behavior: contain;
  }

  .odayaka.odayaka-stopped {
    overflow: hidden;
  }

  .odayaka.odayaka-smooth iframe {
    pointer-events: none;
  }
`