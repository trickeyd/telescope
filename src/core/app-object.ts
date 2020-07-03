import { RelayMap, ModelMap } from "../map/application-map";
import { Schema } from "../model/schema-model/schema";
import { createModelFromSchema } from "../model/schema-model/model";
import { Debug } from "../debug/debug-object";
import { createModelSelector, ModelSelector } from "../model/schema-model/model-selector";
 
export interface App {
  readonly model: ModelSelector
  readonly service: any
  readonly log: any
  readonly debug: Debug
  readonly relays: RelayMap
} 

export const createAppObject = (modelMap: ModelMap, service: any, debug: any, relays: RelayMap): App => {
  const modelSelector = createModelSelector(modelMap); 
  return {
    get model() { return modelSelector },
    get service() { return service },
    get log() { return debug.log },
    get debug() { return debug },
    get relays() { return relays }
  }
}

