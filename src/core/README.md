### Hello!

##### Just a quick note about the code:
- This is a segment of a framework I have written that I have just converted to typescript.
- It is not finished, and I have not added comments I'm afraid, so it won't be well documented. If you would like some, please ask.

- The included core.ts file contains the user-facing API for the project. 
- The idea is that the user is able to chain together a bunch of functions with conditionals for any event fired from a react project. 
- There is also a concept of 'scope', which means that small parts of logic can be compartmentalised and reused.
- The framework already exists in JS and works well - I think :-) - and I am improving and upgrading to TS for v2. 

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
