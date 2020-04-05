import { RelayMap } from "../map/application-map";
import { Schema } from "../model/schema-model/schema";
import { createModelFromSchema } from "../model/schema-model/model";
import { Debug } from "../debug/debug-object";
 
export interface App {
  readonly model: any
  readonly service: any
  readonly log: any
  readonly debug: Debug
  readonly relays: RelayMap
} 

export const createAppObject = (model: any, service: any, debug: any, relays:RelayMap): App => ({
  get model() { return model },
  get service() { return service },
  get log() { return debug.log },
  get debug() { return debug },
  get relays() { return relays }
})

