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

export const validateValueBySchemaNode = (value: any, propDescriptor: PropertyDescriptor): ValidateStoreResult => {
  const { isValid, failMessage } = propDescriptor.validate(value) 
  const result = isValid ? 'passed' : failMessage

  if(isUndefined(value))
    return { isValid, validationMap: `${value} -> ${result}` }

  switch(propDescriptor.type){
    case PropertyType.object:
      const { isValid: objectIsValid, validationMap: objectValidationMap } = validateStoreObject(value, propDescriptor.content) 
      return { isValid: isValid && objectIsValid, validationMap: { __object: result, ...(objectValidationMap as StringToAny) }}

    case PropertyType.array:
      let arrayIsValid = true;
      const validationMap = { __array: result, values: value.map(
        (arrValue: any) => {
          const { isValid, validationMap: arrayValidationMap } = validateStoreObject(arrValue, propDescriptor.content) 
          arrayIsValid = isValid ? arrayIsValid : isValid
          return arrayValidationMap 
        }
      )}
     return { isValid: isValid && arrayIsValid, validationMap } 

    default:
      return { isValid, validationMap: `${value} -> ${result}` }
  }
}
   
const validateStoreObject = (store: StringToAny, schemaNode: SchemaNode): ValidateStoreResult => {
  const { isValid, storeKeys, validationMap}: ValidateStoreAccumulator = Object.entries(schemaNode).reduce(
    (
      { isValid: storeIsValid, storeKeys, validationMap }: ValidateStoreAccumulator,
      [key, propDescriptor]: [string, PropertyDescriptor]
    ) => {
      const { isValid: nodeIsValid, validationMap: nodeValidationMap } = validateValueBySchemaNode(store[key], propDescriptor)
      validationMap[key] = nodeValidationMap;
      
      const storeKeyIndex = storeKeys.indexOf(key) 
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



