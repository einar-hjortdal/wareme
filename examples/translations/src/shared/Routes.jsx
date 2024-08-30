import { component, Fragment } from "@dark-engine/core";
import { Router } from "@dark-engine/web-router";
import { useTranslation } from "@wareme/translations";

import { languages } from "./messages/utils";

const Root = component(({ slot }) => {
  return slot
})

const Home = component(() => {
  const { t } = useTranslation()
  return (
    <main>
      {t('welcome')}
    </main>
  )
})

const NotFound = component(() => {
  const { t } = useTranslation()
  return (
    <main>
      {t('notFound')}
    </main>
  )
})

const baseRoutes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'not-found',
    component: NotFound
  }
]

const generateRoutes = (baseRoutes) => {
  const alternateLanguageRoutes = []
  const notFound = {
    path: '**',
    redirectTo: 'not-found'
  }
  for (let i = 1, len = languages.length; i < len; i++) {
    const language = languages[i]
    alternateLanguageRoutes.push({
      path: language,
      component: Fragment,
      children: [
        ...baseRoutes,
        notFound
      ]
    })
  }
  return [
    {
      path: '/',
      component: Root,
      children: [
        ...baseRoutes,
        ...alternateLanguageRoutes,
        notFound
      ]
    }
  ]
}

const routes = generateRoutes(baseRoutes)

const Routes = component(({ currentPath }) => {
  return (
    <Router routes={routes} url={currentPath}>
      {slot => slot}
    </Router>
  )
})

export default Routes