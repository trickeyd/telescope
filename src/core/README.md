### Hello!

##### Just a quick note about the code:
- This is a segment of a framework I have written that I am just converting to typescript, as well as adding some new functionality.
- It is not finished, and I have not added comments I'm afraid, so it won't be well documented other than (hopefully) well named variables and types. 
- If you would like comments added, please ask - I just wanted to get it to you asap.

- The included core.ts file contains the user-facing API for the project. 
- The idea is that the user is able to chain together a bunch of functions with conditions for any event fired from a react project. 
- There is also a concept of 'scope', which means that small parts of logic can be compartmentalised and reused.
- The framework already exists in JS, I have used it for a messaging app and it works well - I think at least :-)
- I am improving and upgrading to TS for v2. 

##### Use case:
- Bellow in a fictitious example.
```typescript
on(DELETE_ACCOUNT,
  scope => scope(
    showAreYouSureYouWantToDeleteYourAccount  // because it can all be async, you can wait for a user interaction and then handle too. 
  ).if((data, app) => data.initialDelete === true)(
    showAreYouSureYouWantToDeleteYourAccountSecondChance
  ).if((data, app) => data.secondDelete === true)(
    fetch('delete-account'),
    clearCurrentUserAndAccessToken,
    removeInstanceToken,
    logout,
    toLogin,
    clearHistory,
    showAccountDeleted
  )
) 
```
- To explain the scope system, this could be rewritten like this:
```typescript
const fetchAndHandleAccountDeletion = scope => scope(
  fetch('delete-account'),
  clearCurrentUserAndAccessToken,
  removeInstanceToken,
  logout,
  toLogin,
  clearHistory,
  showAccountDeleted
)

on(DELETE_ACCOUNT,
  scope => scope(
    showAreYouSureYouWantToDeleteYourAccount
  ).if((data, app) => data.initialDelete === true)(
    showAreYouSureYouWantToDeleteYourAccountSecondChance
  ).if((data, app) => data.secondDelete === true)(
    fetchAndHandleAccountDeletion
  )
)  
``` 

##### Reasons for framework
- The framework uses promises at every stage so everything is async, this means you can for example, trigger a alert,
react to the user interaction in a single 'flow'
- Because every function is run by an overarching 'runner', or 'flow', debugging information can provide a full vertical
slice at any point, and a stack of business only functions. I have found this to make debugging really easy.
- The learning curve for this framework is extremely quick as the syntax is intended to emulate general code.
- It is extremely testable as everything comes down to a series of small functions, or units.
