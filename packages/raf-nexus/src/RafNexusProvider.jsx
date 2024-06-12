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

const getRafNexus = (rafNexusProp) => {
  if (detectIsEmpty(rafNexusProp)) {
    return createRafNexusInstance()
  }
  return rafNexusProp
}

export const RafNexusProvider = component(({ rafNexus, slot }) => {
  const value = useMemo(() => {
    const currentRafNexus = getRafNexus(rafNexus);
    return { rafNexus: currentRafNexus };
  }, [rafNexus])
  return <RafNexusContext value={value}>{slot}</RafNexusContext>
})
