import {
  Validator,
  MultiValidatorResult,
  PropertyDescriptor,
  ValidateStoreResult,
  PropertyType,
  ValidateStoreAccumulator,
  SchemaNode,
  ValidationEnablerMapFactory,
} from "./types";
import isUndefined from 'lodash.isundefined'
import isString from 'lodash.isstring'
import isNull from 'lodash.isnull'
import { StringToAny } from "../../types";
import { ModelNode } from "./model";

export const createCommonValidation = (validateType?: (item: any) => boolean, propType?: PropertyType): ValidationEnablerMapFactory =>
  <T>(returnObject:T, validators: Validator[]) => {
    let isRequired = false
    let isNullable = false
    validators.push((item) => {
      if(isUndefined(item)) {
        if(isRequired) 
          return "it's undefined but marked as required"
      }
      else if(isNull(item)) {
        if(!isNullable) 
          return "it's null but not marked as nullable"
      }
      else if(validateType && !validateType(item))
        return `it's not a ${propType}` 

      return true
    })  
    return {
      required: (): T => {
        isRequired = true 
        return returnObject
      },
      nullable: (): T => {
        isNullable = true
        return returnObject
      }
    }
  }

export const createLengthValidation = (): ValidationEnablerMapFactory =>
  <T>(returnObject:T, validators: Validator[]) => {
    let setLength: undefined | number
    let minLength: undefined | number
    let maxLength: undefined | number

    validators.push((item) => {
      const length = item.length

      if(isUndefined(length))
        return `it has no property 'length'`

      if(!isUndefined(setLength) && length !== setLength)
        return `it's length is ${length} but should be ${setLength}` 

      if(!isUndefined(minLength) && length < minLength)
        return `it's length is ${length} but should be more than ${--minLength}`

      if(!isUndefined(maxLength) && length > maxLength)
        return `it's length is ${length} but should be less than ${++maxLength}`
     
      return true
    })

    return {
      setLength: (setLength: number): T => {
        setLength = setLength 
        return returnObject
      },
      minLength: (minLength: number): T => {
        minLength = minLength 
        return returnObject
      },
      maxLength: (maxLength: number): T => {
        maxLength = maxLength 
        return returnObject
      }, 
    }
  }

export const createDateValidation = (): ValidationEnablerMapFactory =>
  <T>(returnObject:T, validators: Validator[]) => {
    let minDate: undefined | Date
    let maxDate: undefined | Date

    validators.push((item) => {
      if(minDate && item < minDate)
        return `it should not be before ${minDate.toISOString()}`


      if(maxDate && item > maxDate)
        return `it should not be after ${maxDate.toISOString()}`

      return true
    })

    return {
      earliest: (earliest: Date): T => {
        minDate = earliest
        return returnObject
      },
      latest: (latest: Date): T => {
        maxDate = latest
        return returnObject
      }
    }
  }
 
export const createValidatorAdder = (): ValidationEnablerMapFactory => <T>(returnObject: T, validators: Validator[]) => ({
  validate: (validator: Validator): T => {
    validators.push(validator)
    return returnObject
  }
})
 
export const validateAll = (validators: Validator[]) => (item: any): MultiValidatorResult =>
  validators.slice(0).reduce((acc: MultiValidatorResult, validate: Validator, i: number, arr: Validator[]): MultiValidatorResult => {
    const validatorResult = validate(item) 
    const isValid = validatorResult === true
    isNull(item) || isUndefined(item) && arr.splice(1) 
       
    if(!isValid){
      if(!isString(validatorResult))
        throw Error('Validator function must return true or a string')

      acc.isValid = false
      acc.failMessage += `${i === 0 ? "failed because " : " and "}${validatorResult}`
    }
    return acc
  },
  { isValid: true, failMessage: "" }
  )

export const validateValueByModelNode = (value: any, node: ModelNode): ValidateStoreResult => {
  const descriptor = node.descriptor
  const { isValid, failMessage } = descriptor.validate(value) 

  const result = isValid ? 'passed' : failMessage

  if(isUndefined(value))
    return { isValid, validationMap: `${value} -> ${result}` }

  switch(descriptor.type){
    case PropertyType.object:
      const { isValid: objectIsValid, validationMap: objectValidationMap } = validateStoreObject(value, (node.children as ModelNode[])) 
      return { isValid: isValid && objectIsValid, validationMap: { __object: result, ...(objectValidationMap as StringToAny) }}

    case PropertyType.array:
      let arrayIsValid = true
      const validationMap = { __array: result, values: value.map(
        (arrValue: any) => {
          const arrayChildNode = (node.children as ModelNode[])[0]
          const arrayChildType = arrayChildNode.descriptor.type
          const { isValid, validationMap: arrayValidationMap } =
            arrayChildType === PropertyType.object
              ? validateStoreObject(arrValue, (arrayChildNode.children as ModelNode[])) 
              // this is for arrays that have non-object type
              : validateValueByModelNode(arrValue, arrayChildNode) 

          arrayIsValid = isValid ? arrayIsValid : isValid
          return arrayValidationMap 
        }
      )}
      return { isValid: isValid && arrayIsValid, validationMap } 

    default:
      return { isValid, validationMap: `${value} -> ${result}` }
  }
}
   
const validateStoreObject = (store: StringToAny, nodes: ModelNode[]): ValidateStoreResult => {
  const { isValid, storeKeys, validationMap}: ValidateStoreAccumulator = nodes.reduce(
    (
      { isValid: storeIsValid, storeKeys, validationMap }: ValidateStoreAccumulator,
      node: ModelNode
    ) => {
      const name = node.descriptor.name 
      const { isValid: nodeIsValid, validationMap: nodeValidationMap } = validateValueByModelNode(store[name], node)
      validationMap[name] = nodeValidationMap
      
      const storeKeyIndex = storeKeys.indexOf(name) 
      storeKeyIndex !== -1 && storeKeys.splice(storeKeyIndex, 1) 

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



