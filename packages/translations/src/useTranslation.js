import { useContext, useState, useEffect, useCallback, useRef } from '@dark-engine/core'
import { TranslationsContext } from './TranslationsProvider'

function alwaysNewT (translator, idPrefix) {
  return translator.getFixedT(idPrefix)
}

function useMemoizedT (translator, idPrefix) {
  return useCallback(alwaysNewT(translator, idPrefix), [translator, idPrefix,]);
}

export function useTranslation (idPrefix) {
  const { translator } = useContext(TranslationsContext)
  const memoGetT = useMemoizedT(translator, idPrefix)
  const getT = () => memoGetT
  const getNewT = () => alwaysNewT(translator, idPrefix)
  const [t, setT] = useState(getNewT)

  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    const updateT = () => {
      if (isMounted.current === true) {
        setT(getNewT)
      }
    }

    // Subscribe to changes in the translator instance on mount
    translator.onLanguageChanged(updateT)

    // Unsubscribe on unmount
    return () => {
      isMounted.current = false
      translator.offLanguageChanged(updateT)
    }
  }, [translator])

  // Ensure translator instance is up to date after mounting
  // It may have been replaced or its state may have changed
  useEffect(() => {
    if (isMounted.current === true) {
      setT(getT)
    }
  }, [translator, idPrefix])

  return { t, translator }
}
