import { component, createContext, detectIsEmpty, useContext, useMemo } from "@dark-engine/core";
import { detectIsBrowser } from "@dark-engine/platform-browser";

import { RafNexus } from "./rafNexus";

const RafNexusContext = createContext(null)

export const useRafNexus = () => useContext(RafNexusContext)

const createRafNexusInstance = () => {
  if (detectIsBrowser()) {
    return new RafNexus()
  }
  return null
}

export const RafNexusProvider = component(({ rafNexus, slot }) => {
  const value = useMemo(() => {
    if (detectIsEmpty(rafNexus)) {
      const newRafNexusInstance = createRafNexusInstance()
      return { rafNexus: newRafNexusInstance }
    }
    return { rafNexus }
  }, [rafNexus])
  return <RafNexusContext value={value}>{slot}</RafNexusContext>
})
