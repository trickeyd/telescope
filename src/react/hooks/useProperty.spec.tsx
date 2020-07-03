import React from "react"
import { mount } from "enzyme"
import { ModelMap, Telescope, createTelescope } from "../../map/application-map"
import { useTelescope } from "./useTelescope"
import { Schema, Str } from "../../model/schema-model/schema"
import { ModelSelector } from "../../model/schema-model/model-selector"
import { useProperty } from "./useProperty"
import { TelescopeProvider } from "../context";

const MODEL_1 = "MODEL_1";
const MODEL_2 = "MODEL_2";

describe("useProperty", () => {
  describe("when telescope app is created and models are added", () => {
    let modelMap: ModelMap
    let modelSelector: ModelSelector
    let telescope: Telescope

    beforeEach(() => {
      telescope = createTelescope()

      modelMap = Object.create(null)

      telescope.createModels({
        [MODEL_1]: Schema({ prop: Str() }), 
        [MODEL_2]: Schema({ prop: Str() }), 
      })

      telescope.model[MODEL_1].set({ prop: MODEL_1 }) 
      telescope.model[MODEL_2].set({ prop: MODEL_2 }) 
       
    })

    it("should make models accessable by name", (done) => {

      const TestHook = ({ callback }: { callback:Function}) => {
        const prop1 = useProperty(MODEL_1, 'prop')
        const prop2 = useProperty(MODEL_2, 'prop')
        callback(prop1, prop2);
        return null;
      }; 

      const callback = (prop1:string, prop2: string) => {
        expect(prop1).toBe(MODEL_1)
        expect(prop2).toBe(MODEL_2) 
        done()
      }

      mount(<TelescopeProvider telescope={telescope}><TestHook callback={callback} /></TelescopeProvider>)
    })

    it("should make models accessable via selector function", (done) => {
      const TestHook = ({ callback }: { callback:Function}) => {
        const prop1 = useProperty(modelMap => modelMap[MODEL_1], 'prop')
        const prop2 = useProperty(modelMap => modelMap[MODEL_2], 'prop')
        callback(prop1, prop2);
        return null;
      }; 

      const callback = (prop1:string, prop2: string) => {
        expect(prop1).toBe(MODEL_1)
        expect(prop2).toBe(MODEL_2) 
        done()
      }

      mount(<TelescopeProvider telescope={telescope}><TestHook callback={callback} /></TelescopeProvider>)
    })
 
  })
})
 
