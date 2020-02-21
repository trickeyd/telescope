import React, { ComponentType, useState } from 'react'
import { StringToAny } from "../types";

interface Props {
  Component: ComponentType<any> 
  app: any
  passedProps: StringToAny,
  mapStateToProps: (model: any) => StringToAny
  mapDispatchToProps: (dispatch: Function) => StringToAny
}

export const ComponentWrapper = ({
  Component,
  app,
  passedProps,
  mapStateToProps,
  mapDispatchToProps
}: Props) => {

  const mappedState = mapStateToProps(app.modal)
  const mappedDispatch = mapDispatchToProps(app.dispatch)

  return (
    <Component {...passedProps} {...mappedState} {...mappedDispatch} /> 
  )
}

