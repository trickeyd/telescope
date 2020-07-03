import isString from 'lodash.isstring'
import { useState, useEffect, useCallback, useRef } from "react"
import { useTelescope } from "./useTelescope";
import { Model } from "../../model/schema-model/model";
import { Telescope } from "../../map/application-map";
import { ModelSelectorFunction } from "../../model/schema-model/model-selector";

export const useProperty = (nameOrSelector: string | ModelSelectorFunction, path: string) => {
  const telescope: Telescope = useTelescope()

  const isStringParam = isString(nameOrSelector) 
  const model: Model = isStringParam
    ? telescope.model[(nameOrSelector as string)]
    : (nameOrSelector as ModelSelectorFunction)(telescope.model)

  if(!model) throw new Error(`Model ${isStringParam ?  nameOrSelector : "you selected"} does not exist`)

  const [value, setValue] = useState(model.getProp(path))

  const onPropChanged = useCallback((latest: any) => {
    if(latest != value) setValue(latest) 
  }, [])

  const latest = model.getProp(path)
  useEffect(() => {
    if(latest !== value) setValue(latest) 
    // TODO - temporary fix
    // I am going to refactor the model so it is never even emitted 
    // unless the value has changed. This will greatly improve performance
  }, [JSON.stringify(latest), JSON.stringify(value)])

  useEffect(() => {
    model.getPropertyUpdated(path).on(onPropChanged)
    return () => {
      model.getPropertyUpdated(path).un(onPropChanged)
    }
  })

  return value
}
