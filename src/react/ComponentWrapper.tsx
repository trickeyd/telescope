import React, { ComponentType, useState } from 'react'
import { StringToAny } from "../types";
import { Signal } from "../signals/signal";

interface Props {
  Component: ComponentType<any> 
  app: any
  passedProps: StringToAny,
  mapStateToProps: (model: any) => StringToAny
  mapDispatchToProps: () => { [ key: string ]: Signal<any> }
}

export const ComponentWrapper = ({
  Component,
  app,
  passedProps,
  mapStateToProps,
  mapDispatchToProps
}: Props) => {

  const mappedState = mapStateToProps(app.model)
  const mappedDispatch = mapDispatchToProps()

  const parsedDispatch = Object.entries(mappedDispatch).reduce(
    (acc, [ key, signal ]) => ({ ...acc, [key]: signal.dispatch }),
    {}
  )

  return (
    <Component {...passedProps} {...mappedState} {...parsedDispatch} /> 
  )
}

