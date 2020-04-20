import { useState, useEffect, useCallback } from "react"
import { useTelescope } from "./useTelescope";
import { Model } from "../../model/schema-model/model";
import { Telescope } from "../../map/application-map";

export const useProperty = (modelName: string, path: string) => {
  const telescope: Telescope = useTelescope()
  const model: Model = telescope.model.get(modelName)
  if(!model) throw new Error(`Model ${modelName} does not exist`)

  const [value, setValue] = useState(model.getProp(path))

  const onPropChanged = useCallback((payload: any) => setValue(payload), [])

  useEffect(() => {
    model.listenToProperty(path, onPropChanged)
    return () => {
      model.unlistenToProperty(path, onPropChanged)
    }
  })

  return value
}