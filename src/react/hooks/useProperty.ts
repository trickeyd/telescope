import { useState, useEffect, useCallback, useRef } from "react"
import { useTelescope } from "./useTelescope";
import { Model } from "../../model/schema-model/model";
import { Telescope } from "../../map/application-map";

export const useProperty = (modelName: string, path: string) => {
  const telescope: Telescope = useTelescope()
  const model: Model = telescope.model[modelName]
  if(!model) throw new Error(`Model ${modelName} does not exist`)

  const [value, setValue] = useState(model.getProp(path))

  const onPropChanged = useCallback((latest: any) => {
    if(latest != value) setValue(latest) 
  }, [])

  const latest = model.getProp(path)
  useEffect(() => {
    if(latest !== value) setValue(latest) 
    // TODO - temporary fix
  }, [JSON.stringify(latest), JSON.stringify(value)])

  useEffect(() => {
    model.getPropertyUpdated(path).on(onPropChanged)
    return () => {
      model.getPropertyUpdated(path).un(onPropChanged)
    }
  })

  return value
}
