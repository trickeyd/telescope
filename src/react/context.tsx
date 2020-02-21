import React, { createContext } from 'react'

const Context = createContext(null)
export const Consumer = Context.Consumer

interface Props {
  children: JSX.Element
  app: any
}
   
export const Provider = ({ children, app }: Props) => {
  return (
    <Context.Provider value={app}>
      { children }
    </Context.Provider>
  ) 
}
