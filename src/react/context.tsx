import React, { createContext, useEffect } from 'react'
import { Telescope } from "../map/application-map";

export const TelescopeContext = createContext<Telescope | null>(null)

interface Props {
  children: JSX.Element
  telescope: Telescope
}
   
export const TelescopeProvider = ({ children, telescope }: Props) => {

  useEffect(() => {
    telescope.signalMap.INIT.emit()
  }, [])

  return (
    <TelescopeContext.Provider value={telescope}>
      { children }
    </TelescopeContext.Provider>
  ) 
}
