import { useContext, useState, useEffect } from '@dark-engine/core'
import { TranslationsContext } from './TranslationsProvider'

export function useTranslation (idPrefix) {
  const { translator } = useContext(TranslationsContext)

  // Get a new function every time
  const getT = () => {
    return translator.getFixedT(idPrefix)
  }

  const [t, setT] = useState(getT)

  useEffect(() => {
    // Update the t function
    const updateT = () => {
      setT(getT)
    }

    // Subscribe to changes in the translator instance on mount
    translator.onLanguageChanged(updateT)

    // Unsubscribe on unmount
    return () => {
      translator.offLanguageChanged(updateT)
    }
  }, [translator])

  return { t, translator }
}
