[![NPM Version][npm-image]][npm-url]
# Telescope

<h3>A functional MVC framework for React - by  <a href="https://www.npmjs.com/~idiosync"><img width="100px" height="31px" valign="middle" src="https://storage.googleapis.com/idiosync-web-images/telescope/idiosync_very_small.png"></a></h3>

Reduced boilerplate - Self-documenting syntax - Easy to test - Improved debugging - Data validation

![Telescope](https://storage.googleapis.com/idiosync-web-images/telescope/telescope.png "Telescope")

## Installation

yarn:
```bash
$ yarn add @idiosync/telescope
```

npm:
```bash
$ npm i @idiosync/telescope
```

## Reason
Telescope aims to present controller logic simply, as if it were procedural code. Due to its 'building block' nature, 
funcitons can be packaged and endlessly restructured for different side effects. This means that for any signal that is emitted,
there is a single top down view of every side effect that follows, and no other signals will have to be emitted. This top down view just
appears as a list of functions which, as they are all named, makes Telescope extremely self-documenting.

Logic is encapsulated into a 'scopes' which are analogous to scopes found in regular vanilla javascript.
In Telescope however, these scopes are made up of functions, conditional logic and more scopes.
As with vanilla javascript, scopes have access to their own variables, and the variables of parent scopes via the data object that
is passed to each middleware function.

Telescope's async nature makes it particularly easy to program complex user interactions that can conceptually be seen as a single process.
An example of this would be opening a dialogue, waiting for it to animate and finally reacting to the user's response.


```js
const askUserToSaveScope = scope => scope(   //<--- this scope can now be reused in 
  slideSaveDialogueInFrom("right"),          //<--- response to any emited signal
  askUserToSave
).if(userDidClickSave)(
  saveDocument
)

telescope.on(signals => signals.CLOSE_DOCUMENT_CLICKED,
  scope => scope.if(documentIsNotSaved)(
    askUserToSaveScope, // <--- above scope is added here
    closeDocument
  )
)
```

The console can track everything that happens step-by-step, along with any 
logs or errors at the appropriate point and indentation. 
The job id allows "jobs" to be filtered in the console, which is useful when many are run concurrently.
(true must be passed into the telescope factory to enable these logs)

Console for above example:
```bash
|     j:0     |  EMITTED  |-------------->  CLOSE_DOCUMENT_CLICKED {}
|     j:0     |  if(documentIsNotSaved √) √ (
|     j:0     |    askUserToSaveScope --> (
|     j:0     |      slideSaveDialogueInFrom =>
|     j:0     |      askUserToSave =>
|     j:0     |    ) 
|     j:0     |    if(userDidClickSave √) √ (
|     j:0     |      saveDocument =>
|     j:0     |    ) 
|     j:0     |  )
|     j:0     |  COMPLETE |<--------------  CLOSE_DOCUMENT_CLICKED
```

I have tried to make the Telescope syntax very intuitive to anyone that has worked with javascript for a while. For this reason it is probably
easiest understood it by viewing actual scenarios, as opposed to reading lengthy documentation. I am currently working on a Hello World so
please bare with me.

## Setup

App.js:
```js
import { createTelescope, TelescopeProvider } from "@idiosync/telescope"

// passing true here enables console debugging. 
const telescope = createTelescope(true)

function App() {
  return (
    <TelescopeProvider telescope={telescope}>
      { /* App goes here */ }
    </TelescopeProvider>
  )
}

export default App
```
 
## Models

Data in Telescope is stored in models which are validated whenever anything is changed.
To achieve this, Schemas are written when setting up telescope. As well as type checking, bespoke validation can be added here.

```js
import { createTelescope, Schema, Str, Num } from "@idiosync/telescope"

const telescope = createTelescope() 

// the Schema function accepts an object
const userModelSchema = Schema({
  username: Str().required().maxLength(10).minLength(2),
  age: Num().required().validate(age => age < 100 && age >= 18)
})

telescope.createModels({
  USER: userModelSchema
})

```

Model properties are accessed in components with the 'useProperty' hook, which will update whenever the value is changed.

```js
import React from 'react';
import { useProperty } from '@idiosync/telescope'

export const MyComponent = () => {

  // you can use a fucntion that recieves a ModelMap and returns a Model as the first param
  // this allows you to type the your own Models if desired
  const username = useProperty((models: MyModels) => models.USER, 'username')

  // alternatively, using the model name for the first param will also work as shown bellow .
  const username = useProperty("USER", 'username') 

  return (
    <p>{username}</p>
  )
}
```

The path string uses the same principal as lodash get functions: 
```js
  const username = useProperty("USER", 'loyaltyInfo.numPoints') 
```
 

### Schema Types

```js
// String 
Str()
  .required()
  .nullable()
  .setLength(/* accepts number */)
  .maxLength(/* accepts number */)
  .minLength(/* accepts number */)
  .validate(/* accepts function which returns boolean */)


// Number 
Num()
  .required()
  .nullable()
  .validate(/* accepts function which returns boolean */)


// Boolean 
Bool()
  .required()
  .nullable()
 

// Date 
Date()
  .required()
  .nullable() 
  .earliest(/* accepts a js Date object */)
  .latest(/* accepts a js Date object */)


// Array
Arr()
  .required()
  .nullable()
  .setLength(/* accepts number */)
  .maxLength(/* accepts number */)
  .minLength(/* accepts number */)
  .validate(/* accepts function which returns boolean */)
  // Arrays can also be represented with a [] literal, 
  // and default configuration will be applied


// Object
Obj()
  .required()
  .nullable()
  .validate(/* accepts function which returns boolean */) 
  // Objects can also be represented with a {} literal, 
  // and default configuration will be applied
   

// Any
Any()
  .required()
  .nullable()
  .validate(/* accepts function which returns boolean */) 

```

## Signals

Signals are the main event system used in Telescope. They don't use strings to 
identify themselves and validation can be added if desired.

```js
import { createTelescope, Str, Num } from "@idiosync/telescope"

const telescope = createTelescope() 

const SIGNALS = {
  LOGIN_CLICKED: Signal(),
  SIGNUP_CLICKED: Signal({
    name: Str(),
    age: Num().validate(age => age < 100 && age >= 18)
  })
}
 
telescope.registerSignals(SIGNALS)
``` 

Signals are accessed in components with the 'useSignal' hook.

```js
import React from 'react';
import { useSignal } from '@idiosync/telescope'

export const MyComponent = () => {
  const onLogin = useSignal(signals => signals.LOGIN_CLICKED)
  const onSignup = useSignal(signals => signals.SIGNUP_CLICKED)

  return (
    <div>
      <button onClick={onLogin} />
      <button onClick={() => onSignup({ name: "James Trickey", age: 36 }) } />
    </div>
  )
}
```
 
## Telescope Controller

This is the main meat of the framework. Each one contains a full list of side effects produced by a specific
user interaction including any required async interactions.

```js
telescope.on(signals => signals.REFRESH_CLICKED,
  scope => scope(
    showLoading(true)
  ).if( timeSinceLastUpdateIsMoreThan(1000) )(
    fetchUserProfile
  ).else(
    showStopRefreshingAllTheTimePleaseDialogue
  )(
    showLoading(false)
  )
)
```

### Middleware

Telescope decides how to behave based on the number of arguments a middleware function is expecting.

Functions with two arguments are units of code that interact with services and models. If they return a
Promise (or use async/await), they are considered async and will wait for resolution. These functions are
passed a Data object and an App object as shown bellow:

```js
const fetchUserProfile = async (data, app) => {
  const user = await fetch(PROFILE_URL)
  app.model.USER.setProp('username', user.username)  // this will trigger any listening components to update
}
```

If you want to type your own ModelMap to fit your model structure, you can instead access them as follows
```js
  app.model((modelMap: MyModelMap) => modelMap.USER)
```

Functions with three arguments are identical but are supplied with a callback which must be called to continue:

```js
const fetchUserProfile = (data, app, next) => {
  fetch(PROFILE_URL)
    .then((res) => res.json())
    .then(() => {
      app.model.USER.set(user)  // this will trigger any listening components to update
      next()
    })
}
```

Functions with only one argument receive a Scope function. Scopes are used to encapsulate functionality where is makes 
sense to do so, by supplying an interface for adding middleware, other scopes and conditional logic.
```js
// this is a guard function used in conditional statements, it returns a boolean
const isNewUserProfile = (data, app) =>
  data.scope.get('fetchedUser').id !== app.model.USER.id

const fetchAndStoreUserProfile = scope => scope(
  async (data, app) => {
    const userJson = await fetch(PROFILE_URL)
    data.scope.set('fetchedUser', userJson)
  }
).if( isNewUserProfile )(
  (data, app) => {
    const fetchedUser = data.scope.get('fetchedUser')
    app.model.USER.set(fetchedUser)
  }
) 
``` 

### Scope function
The Scope function as documented above offers an interface for constructing you controller:
```js

Scope.do(...)
//  or 
Scope(...)
// Accepts any number of middleware to run in order

Scope.if()
// Accepts a guard, or conditional function that returns a boolean

```

The if function has an interface of its own:
```js 

if(isSomething).do(...)
// or
if(isSomething)(...)
// Accepts any number of middleware to run in order if condition was met

if(isSomething)().elseif()
// Another if statement that is queried if first it was not met (just as in vanilla js)
// this returns the same interface as 'if'

if(isSomething)().else(...)
// Accepts any number of middleware to run if no other condition was met
// this returns scope interface
```

[npm-image]: https://img.shields.io/npm/v/@idiosync/telescope
[npm-url]: https://www.npmjs.com/package/@idiosync/telescope
