import React, { ComponentType, useState } from 'react'
import { StringToAny } from "../types";
import { Signal } from "../signals/signal";
// @ts-ignore - TODO - find out what to do here as types seem to be defunct
import hoistNonReactStatics from 'hoist-non-react-statics';
import { App } from "../core/app-object";

interface Props {
  Component: ComponentType<any> 
  passedProps: StringToAny,
  app: App,
  mapStateToProps: (model: any) => StringToAny
  mapDispatchToProps: () => { [ key: string ]: Signal<any> }
}

export const ComponentWrapper = ({
  Component,
  passedProps,
  app,
  mapStateToProps,
  mapDispatchToProps
}: Props) => {
  hoistNonReactStatics(ComponentWrapper, Component)
  const mappedState = mapStateToProps(app.model)
  const mappedDispatch = mapDispatchToProps()

  const parsedMappedDispatch = Object.entries(mappedDispatch).reduce(
    (acc, [ key, signal ]) => ({ ...acc, [key]: signal.dispatch }),
    {}
  )

  return (
    <Component {...passedProps} {...mappedState} {...parsedMappedDispatch} /> 
  )
}

