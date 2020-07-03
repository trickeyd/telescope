import { createModelSelector, ModelSelector } from "./model-selector";
import { ModelMap } from "../../map/application-map";
import { createModelFromSchema, Model } from "./model";
import { Schema, Str } from "./schema";

const MODEL_1 = "MODEL_1";
const MODEL_2 = "MODEL_2";

describe("model-selector", () => {
  describe("when supplied with a ModelMap", () => {
    let modelMap: ModelMap
    let modelSelector: ModelSelector
    let model1: Model 
    let model2: Model

    beforeEach(() => {
      modelMap = Object.create(null);
      
      model1 = createModelFromSchema(MODEL_1, Schema({ prop: Str() })) 
      model2 = createModelFromSchema(MODEL_2, Schema({ prop: Str() })) 
      model1.set({ prop: MODEL_1 })
      model2.set({ prop: MODEL_2 })
      modelMap[MODEL_1] = model1 
      modelMap[MODEL_2] = model2

      modelSelector = createModelSelector(modelMap)
       
    })

    it("should make models directly accessable", () => {
      expect(modelSelector[MODEL_1]).toBe(model1)
      expect(modelSelector[MODEL_2]).toBe(model2)
    })

    it("should make models accessable via selector function", () => {
      expect(modelSelector(modelMap => modelMap.MODEL_1)).toBe(model1)
      expect(modelSelector(modelMap => modelMap.MODEL_2)).toBe(model2)
    })
 
  })
})
  
