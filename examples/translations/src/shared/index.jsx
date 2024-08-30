import { component } from "@dark-engine/core"
import { TranslationsProvider } from "@wareme/translations"

import Routes from "./Routes"

export const App = component(({ currentPath, translator }) => {
  return (<>
    <TranslationsProvider translator={translator}>
      <Routes currentPath={currentPath} />
    </TranslationsProvider>
  </>
  )
})
