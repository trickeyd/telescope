import { Schema, Obj, Str, Num, Bool, Arr } from "./schema";
import { PropertyType } from "./types";
import { createModelFromSchema, getModelNodeByPath, ModelNode, parseSchemaNode, Model } from "./model";

describe('model', () => {
  describe('when using a simple schema', () => {
    let schema: Schema
    let modelNode: ModelNode
    let model: Model 

    beforeEach(() => {
      schema = Schema(Obj({
        str: Str(),
        num: Num(),
        bool: Bool(),
        obj: Obj({
          prop1: Str(),
          prop2: Num(),
          obj: Obj({
            str: Str()
          })
        }),
        arr: Arr({
          prop1: Str(),
          prop2: Num()
        }),
        arrLit:[{
          prop: Str()
        }],
        arrWithType: Arr(Num()),
        objLit:{
          prop: Str()
        }
      }))

      modelNode = parseSchemaNode('test', schema.rootSchemaNode)
      model = createModelFromSchema('test',schema) 
       
    })

    // TODO - schema no longer responsible for this
    // move to model spec
    it('should be able to access props on root level', () => {
      expect(getModelNodeByPath(modelNode, 'str').descriptor.type).toBe(PropertyType.string)
       expect(getModelNodeByPath(modelNode, 'num').descriptor.type).toBe(PropertyType.number)
      expect(getModelNodeByPath(modelNode, 'bool').descriptor.type).toBe(PropertyType.boolean)
      expect(getModelNodeByPath(modelNode, 'obj').descriptor.type).toBe(PropertyType.object)
      expect(getModelNodeByPath(modelNode, 'objLit').descriptor.type).toBe(PropertyType.object)
      expect(getModelNodeByPath(modelNode, 'arr').descriptor.type).toBe(PropertyType.array)
      expect(getModelNodeByPath(modelNode, 'arrLit').descriptor.type).toBe(PropertyType.array)
      expect(getModelNodeByPath(modelNode, 'arrWithType').descriptor.type).toBe(PropertyType.array)
    })

    it('should be able to access nested props', () => {
      expect(getModelNodeByPath(modelNode, 'obj.prop1').descriptor.type).toBe(PropertyType.string)
      expect(getModelNodeByPath(modelNode, 'obj.prop2').descriptor.type).toBe(PropertyType.number)
      expect(getModelNodeByPath(modelNode, 'obj.obj.str').descriptor.type).toBe(PropertyType.string)
    })

    it('should throw when attempting to access array members', () => {
      expect(() => getModelNodeByPath(modelNode, 'arr[0]')).toThrow()
      expect(() => getModelNodeByPath(modelNode, 'arr[0].prop1')).toThrow()
      expect(() => getModelNodeByPath(modelNode, 'arr[0].prop2')).toThrow()
    })

    it('should set name to name of property', () => {
      expect(getModelNodeByPath(modelNode, 'str').descriptor.name).toBe('str')
      expect(getModelNodeByPath(modelNode, 'num').descriptor.name).toBe('num')
      expect(getModelNodeByPath(modelNode, 'bool').descriptor.name).toBe('bool')
      expect(getModelNodeByPath(modelNode, 'obj').descriptor.name).toBe('obj')
      expect(getModelNodeByPath(modelNode, 'arr').descriptor.name).toBe('arr')
    })

    it('should convert literals to appropriate type', () => {
      expect(getModelNodeByPath(modelNode, 'arrLit').descriptor.type).toBe(PropertyType.array)
      expect(getModelNodeByPath(modelNode, 'objLit').descriptor.type).toBe(PropertyType.object)
    })

    describe('when setting props', () => {
      let testString: string
      let testNum: number
      let testBool: boolean
      let testObj: object
      let testArr: any[]

      beforeEach(() => {
        testString = 'hello'
        testNum = 23
        testBool = true
        testObj = {
          prop1: testString,
          prop2: testNum,
          obj: {
            str: testString
          }
        } 
        testArr = [{
          prop1: testString,
          prop2: testNum
        }]
      })

      it('should then be retrievable on the top level', () => {
        model.setProp('str', testString)
        model.setProp('num', testNum)
        model.setProp('bool', testBool)
        model.setProp('obj', testObj)
        model.setProp('arr', testArr)
        expect(model.getProp('str')).toBe(testString);
        expect(model.getProp('num')).toBe(testNum);
        expect(model.getProp('bool')).toBe(testBool);
        expect(model.getProp('obj')).toEqual(testObj);
        expect(model.getProp('arr')).toEqual(testArr);
      })

      it('should be possible to retrieve array elements', () => {
        model.setProp('arr', testArr)
        expect(model.getProp('arr[0].prop1')).toBe(testString)
      })

      it('should be changeable on the top level', () => {
        model.setProp('str', testString)
        model.setProp('str', testString + testNum) 
        expect(model.getProp('str')).toBe(testString + testNum);
      })
       
      it('should return cloned data', () => {
        model.setProp('obj', testObj) 
        expect(model.getProp('obj')).toEqual(testObj);
        expect(model.getProp('obj')).not.toBe(testObj);
      })

      it('should change nested props on objects', () => {
        const replacementString = 'replace'
        model.setProp('obj', testObj) 
        model.setProp('obj.prop1', replacementString)
        expect(model.getProp('obj')).toEqual({ ...testObj, prop1: replacementString })
        expect(model.getProp('obj.prop1')).toEqual(replacementString)
      })

      describe('when props are of the wrong type', () => {
        it('should throw an error for simple types', () => {
          expect(() => model.setProp('str', 1)).toThrow()
          expect(() => model.setProp('num', '1')).toThrow()
          expect(() => model.setProp('bool', 'true')).toThrow()
        })

        it('should throw an error for complex types', () => { 
          expect(() => model.setProp('obj', 'sdf')).toThrow()
          expect(() => model.setProp('arr', 'sdf')).toThrow()
        })

        it('should throw when nested prop types', () => {
          expect(() => model.setProp('obj', { ...testObj, prop1: 123 })).toThrow()
          expect(() => model.setProp('arr', [{ prop1: 123, prop2: 123 }])).toThrow()
        })

        it('should throw when nested prop types are set directly', () => {
          expect(() => model.setProp('obj', testObj)).not.toThrow()
          expect(() => model.setProp('arr', testArr)).not.toThrow()
          expect(() => model.setProp('obj.prop1', 123)).toThrow()
          expect(() => model.setProp('arr[0].prop1', 123)).toThrow()
        })
      })

      describe('when listening to update signals', () => {
        const listener = (done: Function, expected: any, path: string) => {
          const inner = (value: any) => {
            expect(value).toEqual(expected)
            model.getPropertyUpdated(path).un(inner)
            done()
          }
          return inner
        } 

        beforeEach(() => {
          model.setProp('obj', testObj)
        })
         
        it('should emit value when prop is updated', done => {
          model.getPropertyUpdated('str').on(listener(done, testString, 'str'))
          model.setProp('str', testString)
        })

        it('should emit value when a child prop is updated', done => {
          model.getPropertyUpdated('obj').on(listener(done, { ...testObj, prop1: testString }, 'obj' ))
          model.setProp('obj.prop1', testString)
        })

        it('should emit value when a parent prop is updated', done => {
          model.getPropertyUpdated('obj.prop1').on(listener(done, testString, 'obj.prop1'))
          model.setProp('obj', testObj)
        })
      })
    })
  })
})
