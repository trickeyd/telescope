import { useContext } from 'react'
import { TelescopeContext } from "../context";
import { Telescope } from "../../map/application-map";

export const useTelescope = (): Telescope => {
  const telescope: Telescope | null = useContext(TelescopeContext);

  if (telescope === null) {
    throw new Error(
      'could not find telescope context value; please ensure the component is wrapped in <Provider>'
    )
  }

  return telescope;
}
