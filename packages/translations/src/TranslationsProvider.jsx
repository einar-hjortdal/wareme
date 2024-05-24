import { component, createContext, useMemo } from '@dark-engine/core'

export const TranslationsContext = createContext(null)

export const TranslationsProvider = component(({ translator, slot }) => {
  const value = useMemo(() => {
    return { translator }
  }, [translator])
  return <TranslationsContext value={value}>{slot}</TranslationsContext>
})
