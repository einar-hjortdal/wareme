import { component } from '@dark-engine/core'
import { createRoot } from '@dark-engine/platform-browser'
import { NavLink, Router } from '@dark-engine/web-router'

import Example1 from './example-1'

const Nav = component(({ slot }) => {
  return (
    <div>
      <div>
        <ul>
          <li><NavLink to='/example-1'>example 1</NavLink></li>
        </ul>
      </div>
      {slot}
    </div>
  )
})

const App = component(() => {
  return (
    <Router routes={[
      {
        path: '',
        component: Nav,
        children: [
          {
            path: 'example-1',
            component: Example1
          }

        ]
      }
    ]}>
      {slot => slot}
    </Router>
  )
})

createRoot(document.getElementById('dark-root')).render(<App />)
