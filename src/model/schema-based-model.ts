import lodashGet from 'lodash.get'
import lodashSet from 'lodash.set'
import has from 'lodash.has'
import isString from 'lodash.isstring'
import isNumber from 'lodash.isnumber'
import isBoolean from 'lodash.isboolean'
import isArray from 'lodash.isarray'
import isPlainObject from 'lodash.isplainobject'

type StringToAny = { [key: string] : any } 
interface ValidateStoreResult {
  isValid: boolean,
  validationMap: StringToAny | string
} 
interface ValidateStoreAccumulator extends ValidateStoreResult {
  storeKeys: string[]
  validationMap: StringToAny 
}

const validateNode = (value: any, typeDescriptor: TypeDescriptor): ValidateStoreResult => {
  const { isValid, failMessages } = typeDescriptor.validator(value) 
  const result = isValid ? 'passed' : `failed because it is ${failMessages.join(' and ')}.`  

  switch(typeDescriptor.type){
    case PropertyType.object:
      const { isValid: objectIsValid, validationMap: objectValidationMap } = validateStore(value, typeDescriptor.contents) 
      return { isValid: isValid && objectIsValid, validationMap: { __object: result, ...(objectValidationMap as StringToAny) }}

    case PropertyType.array:
      let arrayIsValid = true;
      const validationMap = { __array: result, values: value.map(
        (arrValue: any) => {
          const { isValid, validationMap: arrayValidationMap } = validateStore(arrValue, typeDescriptor.contents) 
          arrayIsValid = isValid ? arrayIsValid : isValid
          return arrayValidationMap 
        }
      )}
     return { isValid: isValid && arrayIsValid, validationMap } 

    default:
      return { isValid, validationMap: `${value} -> ${result}` }
  }
}
   
const validateStore = (store: StringToAny, schema: Schema): ValidateStoreResult => {
  const { isValid, storeKeys, validationMap}: ValidateStoreAccumulator = Object.entries(schema).reduce(
    (
      { isValid: storeIsValid, storeKeys, validationMap }: ValidateStoreAccumulator,
      [key, typeDescriptor]: [string, TypeDescriptor]
    ) => {
      const { isValid: nodeIsValid, validationMap: nodeValidationMap } = validateNode(store[key], typeDescriptor)
      validationMap[key] = nodeValidationMap;
      
      storeKeys.splice(storeKeys.indexOf(key), 1) 

      return {
        isValid: storeIsValid && nodeIsValid,
        storeKeys,
        validationMap
      }
    },
    { isValid: true, storeKeys: Object.keys(store), validationMap: {} } 
  )
  storeKeys.forEach((key: string) => validationMap[key] = '!! Property not in schema')

  return {
    isValid: storeKeys.length ? false : isValid,
    validationMap
  }
}

const createModelFromSchema = (name: string, schema: Schema) => {
  let store = Object.create(null)
  let setHasBeenCalled = false
  
  const getProp = (path: string) => {
    lodashGet(store, path)
  }

  const setProp = (path: string, value: any) => {
    if(!has(schema, path))
      throw new Error(`Modal '${name}' has no property ${path} in its schema`)

    const validator = lodashGet(schema, path).validator

    if(setHasBeenCalled && !lodashGet(schema, path).validator(value))
      throw new Error(`Model '${name}' failed validation of property '${path}' with value '${value}'.`)
    
    if(!setHasBeenCalled) {
      const { isValid, validationMap } = validateStore(store, schema)
      if(!isValid)
        throw new Error(`Modal validation failed:\n${JSON.stringify(validationMap, null, 2)}`)
    }

    lodashSet(store, path, value)
  } 

  const set = (value: any) => {
    setHasBeenCalled = true
    console.log(JSON.stringify(validateStore(value, schema), null, 2)) 
    //if(!validateStore(value, schema))
      //throw new Error(`Model  failed validation of property with value '${value}'.`)
     //

    store = value
  }

  return {
    getProp,
    setProp,
    set
  }
 
}


/*------------------------------------------
 * Types
 ------------------------------------------------------------------------------*/   
type Validator = { validate: (item: any) => boolean, failMessage: string }
type MultiValidatorResult = { isValid: boolean, failMessages: string[] }
type TypeDescriptor = { type: PropertyType, validator: (item: any) => MultiValidatorResult, contentsSchema?: SchemaConfig, contents?: any } 
type Schema = { [ key: string ]: TypeDescriptor }

enum PropertyType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  object = 'object',
  array = 'array'
}

interface IStr {
  (): TypeDescriptor
  isRequired: () => IStr
  validate: (validator: Validator) => IStr
}

interface INum {
  (): TypeDescriptor
  isRequired: () => INum
  validate: (validator: Validator) => INum
}

interface IBool {
  (): TypeDescriptor
  isRequired: () => IBool
}
 
interface IArr {
  (): TypeDescriptor
  isRequired: () => IArr
  validate: (validator: Validator) => IArr
} 

interface IObj {
  (): TypeDescriptor
  isRequired: () => IObj
  validate: (validator: Validator) => IObj
} 

type IType = IStr | INum | IBool | IArr | IObj
type SchemaConfig = { [key: string]: IType }


/*------------------------------------------
 * Validators
 ------------------------------------------------------------------------------*/  
const isRequired = (returnObject: any, validators: Validator[]) =>
  () => {
    validators.push({ validate: (item) => item !== undefined, failMessage: 'undefined but marked required' })
    return returnObject
  }

const validate = (returnObject: any, validators: Validator[]) =>
  (validator: Validator) => {
    validators.push(validator)
    return returnObject
  } 

 
const validateAll = (validators: Validator[]) => (item: any): MultiValidatorResult =>
  validators.reduce((acc: MultiValidatorResult, validator: Validator): MultiValidatorResult => {
      if(!validator.validate(item)){
        acc.isValid = false
        acc.failMessages.push(validator.failMessage)
      }
      return acc
    },
    { isValid: true, failMessages: [] }
  )
 


/*------------------------------------------
 * Type descriptors
 ------------------------------------------------------------------------------*/  
const Str = (): IStr => {
  const validators: Validator[] = [{ validate: isString, failMessage: 'not a string'}]
  const returnObject = () => ({ type: PropertyType.string, validator: validateAll(validators) })
  return Object.assign(
    returnObject,
    {
      isRequired: isRequired(returnObject, validators),
      validate: validate(returnObject, validators) 
    }
  )
} 

const Num = (): INum => {
  const validators: Validator[] = [{ validate: isNumber,  failMessage: 'not a number' }]
  const returnObject = () => ({ type: PropertyType.number, validator: validateAll(validators) })
  return Object.assign(
    returnObject,
    {
      isRequired: isRequired(returnObject, validators),
      validate: validate(returnObject, validators) 
    }
  )
}

const Bool = (): IBool => {
  const validators: Validator[] = [{ validate: isBoolean, failMessage: 'not a boolean' }]
  const returnObject = () => ({ type: PropertyType.boolean, validator: validateAll(validators) })
  return Object.assign(
    returnObject,
    {
      isRequired: isRequired(returnObject, validators)
    }
  )
} 

const Arr = (contentsSchema: SchemaConfig): IArr => {
 const validators: Validator[] = [{ validate: isArray, failMessage: 'not an array' }]
  const returnObject = () => ({ type: PropertyType.array, contentsSchema, validator: validateAll(validators) })
  return Object.assign(
    returnObject,
    {
      isRequired: isRequired(returnObject, validators),
      validate: validate(returnObject, validators) 
    }
  )
}

const Obj = (contentsSchema: SchemaConfig): IObj => {
 const validators: Validator[] = [{ validate: isPlainObject, failMessage: 'not an object'} ]
  const returnObject = () => ({ type: PropertyType.object, contentsSchema, validator: validateAll(validators) })
  return Object.assign(
    returnObject,
    {
      isRequired: isRequired(returnObject, validators),
      validate: validate(returnObject, validators) 
    }
  ) 
} 


/*------------------------------------------
 * Schema
 ------------------------------------------------------------------------------*/  

const parseSchema = (schemaConfig: SchemaConfig) =>
  Object.entries(schemaConfig).reduce(
    (acc: { [key: string]: TypeDescriptor}, [key, value]: [string, unknown]) => {
      const descriptor: TypeDescriptor = (value as IType)();
      switch(descriptor.type){
        case PropertyType.array:
        case PropertyType.object:
          acc[key] = {...descriptor, contents: parseSchema(descriptor.contentsSchema as SchemaConfig) }
            break
        default:
          acc[key] = descriptor
            break
      }
      return acc 
    },
    {}
  )  
  

const Schema = (schemaConfig: SchemaConfig) => parseSchema(schemaConfig);

const modal = createModelFromSchema('Shitty Modal',
  Schema({
    id: Num().isRequired(),
    name: Str().isRequired(),
    ant: Num(),
    props: Obj({
      prop1: Str(),
      prop2: Str(),
      list: Arr({
        id: Num(),
        name: Str()
      }),
      another: Obj({
        one: Str()
      })
    })
  })
)

modal.setProp('props.prop1', 123)
modal.set({
  id: 123,
  name: 'kjlj',
  ant: 12,
  props: {
    prop1: 'ijij',
    prop2: 'fsd',
    list: [
      { id: 123, name:'asdf' },
      { id: 234, name:'asdf' }
    ],
    another: {
      one: 'sdf'
    }
  }
})



