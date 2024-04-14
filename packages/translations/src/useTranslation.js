import { useContext, useState, useEffect } from '@dark-engine/core'
import { TranslationsContext } from './TranslationsProvider'

function alwaysNewT (translator, idPrefix) {
  return translator.getFixedT(idPrefix)
}

export function useTranslation (idPrefix) {
  const { translator } = useContext(TranslationsContext)
  const getNewT = () => alwaysNewT(translator, idPrefix)
  const [t, setT] = useState(getNewT)

  useEffect(() => {
    const updateT = () => {
      setT(getNewT)
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
