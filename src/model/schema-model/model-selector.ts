import { ModelMap } from "../../map/application-map";
import { Model } from "./model";
 
export type ModelSelectorFunction = (modelMap:ModelMap) => Model
 
export interface ModelSelector extends ModelMap {
  (modelSelector: ModelSelectorFunction): Model,
}
 
const createModelSelectorFunction = (modelMap: ModelMap) => (modelSelector: ModelSelectorFunction): Model => modelSelector(modelMap)

export const createModelSelector = (modelMap: ModelMap): ModelSelector => Object.assign(createModelSelectorFunction(modelMap), modelMap) 

