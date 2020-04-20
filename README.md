[![NPM Version][npm-image]][npm-url]
# Telescope
### An MVC framework for React 
Reduced boilerplate - Self-documenting syntax - Improved debugging - Data validation

![Telescope log](https://storage.googleapis.com/idiosync-web-images/telescope/telescope.png "Telescope")

## Reason
Telescope aims to present the many functions of a controller like procedural code. It encapsulates logic into 'scopes' - small function lists which have access to their own variables, and can be reused and moved around easily. This ultimately reduces the amount of actions / events needed as logic is just included in the list, rather than being tied to a seporate event.

Telescopes async nature makes it particularly easy to program user actions that are conceptually only one action. An example of this would be opening a dialogue, waiting for an animation to complete and finally reacting to the users response.


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
