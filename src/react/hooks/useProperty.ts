import { useState, useEffect, useCallback } from "react"
import { App } from "../../core/app-object";
import { useApp } from "./useApp";
import { Model } from "../../model/schema-model/model";

export const useProperty = (modelName: string, path: string) => {
  const app: App = useApp()
  const model: Model = app.model.get(modelName)
  if(!model) throw new Error(`Model ${modelName} does not exist`)

  const [value, setValue] = useState(model.getProp(path))

  const onPropChanged = useCallback(({ payload }: { payload: any }) => {
    setValue(payload)
  }, [])

  useEffect(() => {
    model.listenToProperty(path, onPropChanged)
    return () => {
      model.unlistenToProperty(path, onPropChanged)
    }
  })

  return value
}
