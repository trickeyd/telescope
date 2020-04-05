import { useState, useEffect, useCallback, useMemo } from "react"
import { useTelescope } from "./useTelescope";
import { Telescope, RelayFetcher } from "../../map/application-map";

export const useRelay = (relayFetcher: RelayFetcher) => {
  const telescope: Telescope = useTelescope()
  const relayMap = telescope.relayMap
  const relay = relayFetcher(relayMap)
  const [
    { relayIsActive, isInit, payload, componentPayload },
    setRelayState
  ] = useState({
    relayIsActive: false,
    isInit: false,
    payload: undefined,
    componentPayload: undefined
  })

  const relaySwitch = useMemo(() =>
    relay.createSwitch((payload: any) => {
      setRelayState({
        relayIsActive: true,
        isInit: true,
        payload,
        componentPayload: undefined
      })
    }),
    []
  )

  useEffect(() => {
    if(!relayIsActive && isInit) relaySwitch.emit(componentPayload)
  }, [relayIsActive])

  useEffect(() => {
    relaySwitch.bypass  = false
    return () => {
      relaySwitch.bypass = true
    }
  }) 
  
  return [relayIsActive, (componentPayload?: any) =>
    setRelayState({ relayIsActive: false, isInit, payload, componentPayload }), payload]
}
