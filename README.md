[![NPM Version][npm-image]][npm-url]
# Telescope
## An MVC framework for React 
Reduced boilerplate - Self-documenting syntax - Easy to test - Improved debugging - Data validation

![Telescope log](https://storage.googleapis.com/idiosync-web-images/telescope/telescope.png "Telescope")

## Reason
Telescope aims to present the controller logic as if it were procedural code, and in doing so reduce the number of events to
those directly triggered by users.

For any signal that is emitted, there is a single top down view of every side effect that follows it.
Logic is encapsulated into a 'scopes' which are analogous to those found in regular javascript.
In Telescope however, they are made up of lists of function and conditional logic.
As with javascript, scopes have access to their own variables and the variables of parent scopes.

Telescope's async nature makes it particularly easy to program user interactions that are conceptually only one process.
An example of this would be opening a dialogue, waiting for an animation to complete and finally reacting to the user's response.


```js
const askUserToSaveScope = scope => scope(
  slideSaveDialogueInFrom("right"),
  askUserToSave
).if(userDidClickSave)(
  saveDocument
)

app.on(signals => signals.CLOSE_DOCUMENT_CLICKED,
  scope => scope.if(documentIsNotSaved)(
    askUserToSaveScope, // <--- above scope is added here
    closeDocument
  )
)
```


This is a very intuitive framework to anyone that has worked with javascript for a while, and is probably
easiest understood by viewing an actual scenario, as opposed to reading documentation. I am currently working on a Hello World so
please bare with me.

## Installation

yarn:
```bash
$ yarn add @idiosync/telescope
```

npm:
```bash
$ npm i @idiosync/telescope
```

## Setup

App.js:
```js
import { createTelescope, TelescopeProvider } from "@idiosync/telescope"

const app = createTelescope()

function App() {
  return (
    <TelescopeProvider app={app}>
      { /* App goes here */ }
    </TelescopeProvider>
  )
}

export default App
```
 
## Models

Data in Telescope is stored in models which are validated when ever something anything changed.
To achieve this, Schemas are written when setting up the app. As well as type checking, bespoke validation can be added here.

```js
import { createTelescope, Schema, Str, Num } from "@idiosync/telescope"

const app = createTelescope() 

// the Schema function accepts an object
const userModelSchema = Schema({
  username: Str().required().maxLength(10).minLength(2),
  age: Num().required().validate(age => age < 100 && age >= 18)
})

app.createModels({
  USER: userModelSchema
})

```

Model properties are accessed in components with the 'useProperty' hook, which will update whenever the value is changed.

```js
import React from 'react';
import { useProperty } from '@idiosync/telescope'

export const MyComponent = () => {
  const username = useProperty(models => models.USER, 'username')

  return (
    <p>{username}</p>
  )
}
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

const app = createTelescope() 

const SIGNALS = {
  LOGIN_CLICKED: Signal(),
  SIGNUP_CLICKED: Signal({
    name: Str(),
    age: Num().validate(age => age < 100 && age >= 18)
  })
}
 
app.registerSignals(SIGNALS)
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
app.on(signals => signals.REFRESH_CLICKED,
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
    data.scope.set('fetchedUser')
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
