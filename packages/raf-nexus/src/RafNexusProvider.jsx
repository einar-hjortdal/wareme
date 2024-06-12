import { component, createContext, useContext, useMemo } from "@dark-engine/core";

const RafNexusContext = createContext(null)

export const useRafNexus = () => useContext(RafNexusContext)

export const RafNexusProvider = component(({ rafNexus, slot }) => {
  const value = useMemo(() => {
    return { rafNexus }
  }, [rafNexus])
  return <RafNexusContext value={value}>{slot}</RafNexusContext>
})
