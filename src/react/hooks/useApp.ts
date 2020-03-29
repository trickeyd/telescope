import { useContext } from 'react'
import { App } from "../../core/app-object";
import { TelescopeContext } from "../context";

export const useApp = (): App => {
  const app: App | null = useContext(TelescopeContext);

  if (app === null) {
    throw new Error(
      'could not find telescope context value; please ensure the component is wrapped in <Provider>'
    )
  }

  return app;  
}
