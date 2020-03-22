import { Num, Str, Obj, Arr, Bool, Schema } from "./schema";
import { PropertyDescriptor, INum, IStr, IObj, IArr, IBool, PropertyType } from "./types";

describe('schema.ts', () => {
  let schema: Schema
 
  describe('when using schema types', () => {
    const commonValidators = expect.objectContaining({
      required: expect.any(Function),
      nullable: expect.any(Function)
    })
    const validationValidators = expect.objectContaining({ 
      validate: expect.any(Function)
    })
    const lengthValidators = expect.objectContaining({  
      setLength: expect.any(Function),
      maxLength: expect.any(Function),
      minLength: expect.any(Function), 
    })

    describe('Num()', () => {
      let num: INum
      it('should return appropriate functions', () => {
        num = Num()
        expect(num).toEqual(commonValidators)
        expect(num).toEqual(validationValidators)
        expect(num).not.toEqual(lengthValidators)
      })

      it('should create a number property descriptor', () => {
        const numPropDescriptor = Num()('prop') 
        expect(numPropDescriptor).toHaveProperty('name', 'prop')
        expect(numPropDescriptor).toHaveProperty('type', PropertyType.number)
        expect(numPropDescriptor).toHaveProperty('content', undefined)
        expect(numPropDescriptor).toHaveProperty('validate')
      })

      it('should validate a number appropriately', () => {
        expect(Num()('prop').validate(2).isValid).toBe(true)
        expect(Num()('prop').validate('2').isValid).toBe(false)
      })
    })

    describe('Str()', () => {
      let str: IStr 
      it('should return appropriate functions', () => {
        str = Str()
        expect(str).toEqual(commonValidators)
        expect(str).toEqual(validationValidators)
        expect(str).toEqual(lengthValidators)
      })

      it('should validate a string appropriately', () => {
        expect(Str()('prop').validate('2').isValid).toBe(true)
        expect(Str()('prop').validate(2).isValid).toBe(false)
      })
    })

    describe('Bool()', () => {
      let bool: IBool
      it('should return appropriate functions', () => {
        bool = Bool()
        expect(bool).toEqual(commonValidators)
        expect(bool).not.toEqual(validationValidators)
        expect(bool).not.toEqual(lengthValidators)
      })

      it('should validate a boolean appropriately', () => {
        expect(Bool()('prop').validate(true).isValid).toBe(true)
        expect(Bool()('prop').validate(false).isValid).toBe(true)
        expect(Bool()('prop').validate('df').isValid).toBe(false)
      })
       
    })

    describe('Arr()', () => {
      let arr: IArr
      it('should return appropriate functions', () => {
        arr = Arr({})
        expect(arr).toEqual(commonValidators)
        expect(arr).toEqual(validationValidators)
        expect(arr).toEqual(lengthValidators)
      })

      it('should throw an error of no object is passed in', () => {
        // @ts-ignore
        expect(() => Arr()).toThrow()
      })

      it('should validate an array appropriately', () => {
        expect(Arr({})('prop').validate([]).isValid).toBe(true)
        expect(Arr({})('prop').validate({}).isValid).toBe(false)
      })

      it('should have populated content', () => {
        expect(Arr({})('prop').content).not.toEqual(undefined)
      })
    })

    describe('Obj()', () => {
      let obj: IObj
      it('should return appropriate functions', () => {
        obj = Obj({})
        expect(obj).toEqual(commonValidators)
        expect(obj).toEqual(validationValidators)
        expect(obj).not.toEqual(lengthValidators)
      })

      it('should throw an error of no object is passed in', () => {
        // @ts-ignore
        expect(() => Obj()).toThrow()
      })

      it('should validate an object appropriately', () => {
        expect(Obj({})('prop').validate({}).isValid).toBe(true)
        expect(Obj({})('prop').validate([]).isValid).toBe(false)
      })

      it('should have populated content', () => {
        expect(Obj({})('prop').content).not.toEqual(undefined)
      })
       
    })
  })

  describe('when creating a simple schema', () => {
    beforeEach(() => {
      schema = Schema('schema', Obj({
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
        objLit:{
          prop: Str()
        }
      }))
    })

    it('should be able to access props on root level', () => {
      expect(schema.get('str').type).toBe(PropertyType.string)
      expect(schema.get('num').type).toBe(PropertyType.number)
      expect(schema.get('bool').type).toBe(PropertyType.boolean)
      expect(schema.get('obj').type).toBe(PropertyType.object)
      expect(schema.get('arr').type).toBe(PropertyType.array)
    })

    it('should be able to access nested props', () => {
      expect(schema.get('obj.prop1').type).toBe(PropertyType.string)
      expect(schema.get('obj.prop2').type).toBe(PropertyType.number)
      expect(schema.get('arr.prop1').type).toBe(PropertyType.string)
      expect(schema.get('arr.prop2').type).toBe(PropertyType.number)
      expect(schema.get('obj.obj.str').type).toBe(PropertyType.string)
    })

    it('should set name to name of property', () => {
      expect(schema.get('str').name).toBe('str')
      expect(schema.get('num').name).toBe('num')
      expect(schema.get('bool').name).toBe('bool')
      expect(schema.get('obj').name).toBe('obj')
      expect(schema.get('arr').name).toBe('arr')
    })

    it('should convert literals to appropriate type', () => {
      expect(schema.get('arrLit').type).toBe(PropertyType.array)
      expect(schema.get('objLit').type).toBe(PropertyType.object)
    })

  })
})

//model.setProp('anything', { poo: 'sdf' })
//model.setProp('poo', 'sdf')
/*model.set({
  id: 123,
  name: 'kjlj',
  ant: 12,
  props: {
    prop1: 'ijij',
    prop2: 'fsd',
    prop3:'dfd',
    list: [
      { id: 123, name:'asdf' },
      { id: 234, name: 123 }
    ],
    another: {
      one: 'sdf'
    },
  }
})
*/
