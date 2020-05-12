import { useState, useEffect, useCallback, useMemo } from "react"
import { useTelescope } from "./useTelescope";
import { Telescope, RelayFetcher } from "../../map/application-map";

const defaultState = {
  isActive: false,
  isInit: false,
  payload: undefined,
  componentPayload: undefined
} 

interface Relay {
  isActive: boolean
  emit: (componentPayload?: any) => void
  payload?: any
}

export const useRelay = (relayFetcher: RelayFetcher): Relay => {
  const telescope: Telescope = useTelescope()
  const relayMap = telescope.relayMap
  const relay = relayFetcher(relayMap)
  if(!relay)
    throw new Error("Relay not registered")
  const [ { isActive, isInit, payload, componentPayload }, setRelayState ] = useState(defaultState)

  const relaySwitch = useMemo(() =>
    relay.createSwitch((payload: any) => {
      setRelayState({
        isActive: true,
        isInit: true,
        payload,
        componentPayload: undefined
      })
    }),
    []
  )

  useEffect(() => {
    if(!isActive && isInit) relaySwitch.emit(componentPayload)
  }, [isActive])

  useEffect(() => {
    relaySwitch.bypass  = false
    return () => {
      relaySwitch.bypass = true
    }
  }) 
  
  return { 
    isActive,
    emit: (componentPayload?: any) => { 
      setRelayState({ isActive: false, isInit, payload, componentPayload })
    },
    payload
  }
}
