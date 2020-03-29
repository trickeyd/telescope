import React, { ComponentType } from 'react'
import { StringToAny } from "../types";
import { Signal } from "../signals/signal";
import { ComponentWrapper } from "./ComponentWrapper";
import { TelescopeContext } from "./context";
import { App } from "../core/app-object";

export const connect = (
  mapStateToProps: (modal: any) => StringToAny,
  mapDispatchToProps: () => { [key: string]: Signal<any>
}) =>
  (Component: ComponentType<any>) =>
    (props: StringToAny) => (
      <TelescopeContext.Consumer>{
        (app: App | null) => {
          if(app === null)
            throw new Error('null app');
          return (
            <ComponentWrapper
              Component={Component}
              passedProps={props}
              app={app}
              mapStateToProps={mapStateToProps}
              mapDispatchToProps={mapDispatchToProps}
            />
          )
        }
      }</TelescopeContext.Consumer>
    )
