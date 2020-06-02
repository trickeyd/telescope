import { useState, useEffect, useCallback, useRef } from "react"
import { useTelescope } from "./useTelescope";
import { Model } from "../../model/schema-model/model";
import { Telescope } from "../../map/application-map";

export const useProperty = (modelName: string, path: string) => {
  const telescope: Telescope = useTelescope()
  const model: Model = telescope.model[modelName]
  if(!model) throw new Error(`Model ${modelName} does not exist`)

  const propertyUpdated = useRef(model.getPropertyUpdated(path)) 

  const [value, setValue] = useState(model.getProp(path))

  const onPropChanged = useCallback((latest: any) => {
    if(latest != value) setValue(latest) 
  }, [])

  useEffect(() => {
    const latest = model.getProp(path)
    if(latest != value) setValue(latest) 
    propertyUpdated.current.on(onPropChanged)
    return () => {
      propertyUpdated.current.un(onPropChanged)
    }
  })

  return value
}
