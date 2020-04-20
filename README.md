[![NPM Version][npm-image]][npm-url]
# Telescope
### An MVC framework for React 
Reduced boilerplate - Self-documenting syntax - Improved debugging - Data validation

![Telescope log](https://storage.googleapis.com/idiosync-web-images/telescope/telescope.png "Telescope")

## Reason
Telescope aims to create an environmaent in which functions executed in your controller are listed like procedural code. It compartmentalises logic into 'scopes' - small function lists which have access to their own variables, and can be reused and moved around easily. This ultimatly reduces the amount of actions needed to be fired as logic is just included in the list, rather than firing off another action to trigger it.

Telescopes async nature of this makes it particularly easy to program user actions that are conceptually only one action, like opening a dialoge, waiting for an animation to complete and finally reacting to the users response.

```js
const askUserToSaveScope = scope => scope(
  slideSaveDialogueInFrom("right"),
  askUserToSave
).if(userClickedSave)(
  saveDocument
)

app.on(signals => signals.CLOSE_DOCUMENT_CLICKED,
  scope => scope.if(documentIsNotSaved)(
    askUserToSaveScope, // <--- above scope is added here
    closeDocument
  )
```

## Installation:

yarn:
```bash
$ yarn add @idiosync/telescope
```

npm:
```bash
$ npm i @idiosync/telescope
```


[npm-image]: https://img.shields.io/npm/v/@idiosync/telescope
[npm-url]: https://www.npmjs.com/package/@idiosync/telescope
