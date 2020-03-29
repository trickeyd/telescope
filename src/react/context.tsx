import React, { createContext } from 'react'

export const TelescopeContext = createContext(null)

interface Props {
  children: JSX.Element
  app: any
}
   
export const TelescopeProvider = ({ children, app }: Props) => {
  return (
    <TelescopeContext.Provider value={app}>
      { children }
    </TelescopeContext.Provider>
  ) 
}
