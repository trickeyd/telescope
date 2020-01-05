import { FlowFunction } from '../types'
import Iterator from './Iterator'
import _ from 'lodash'

let log = (data, method, isTrue=undefined) => {
    let debug       = data.debug.debugString;

    data.debug.deleteOverrideMethodName();

    let string;
    switch(data.debug.type){
        case 'scope':
            string = 'Scope => ';
            break;
            case 'scope+method':
            string = 'ScopeMethod => ';
            break;
        case 'method':
            string = 'Method: ';
            break;
        case 'guard':
            string = 'Guard: ';
            break;
        default:
            string = 'eh?' + data.debug.type;
    }

    string += ' ';
    if(_.isString(debug)){
        string += debug;
    } else if(method && _.isString(method.name) && method.name !== '') {
        string += method.name;
    } else {
        string += '"unknown"';
    }

    if(_.isBoolean(isTrue)){
        string += ' === ' + isTrue;
    }

    data.debug.log(string);
    return string;
};

export const Scope = (event, parent, data, app) => {
    let _children = [];
    let _isCompleted = false;

    return Object.freeze({
      generateChild: () => {
      /*if(child.hasOwnProperty('INTERNAL_setParent')){
          child.INTERNAL_setParent(_Scope);
          child.INTERNAL_setEventType(_event);
          child.INTERNAL_setObjects(_data, _app);
        }
       */
        _children[_children.length] = child;
      },
      completeScope : () => _isCompleted = true,
      getIsComplete : () => _isCompleted,
      run: (data, app, next) => {
        _isCompleted = false;
        const iterator = Iterator(_children);

        const loop = () => {
          if(_isCompleted || !iterator.hasNext()) {
            if(next) return next(data, app);
            else     return;
          }

          let child = iterator.next();
          child.run(data, app, loop);
        };

        loop();
      },
      get parent() { return parent },
      get event() { return event },
      get app() { return app },
      get data() { return data }
    })
};


let DoWrapper = (parentScope) => (...methods) => {
  let _DoBlock = {};
  let runner = Flow(parentScope)(...methods);

  _DoBlock.run = runner.run;

  parentScope.addChild(_DoBlock);

  return ChoiceWrapper(parentScope);
};


let IfWrapper = (parentScope) => {
  // let _ifScope = Scope();
    parentScope.addChild(_ifScope);

    return Conditional(_ifScope);
};


export const ChoiceWrapper = (scope) => Object.freeze({
  get do() { return DoWrapper(scope) },
  get if() { return IfWrapper(scope) },
  get app() { return scope.app },
  get data() { return scope.data },
})


let Conditional = (ifScope) => {
    let _isInverted = false;

    let _internals = (...guards) => (...methods) => {
        // make sure there are no undefined etc.
        for(let i = guards.length - 1; i >= 0; i--){
            // we allow for null to be added for the sake of conditional
            // scope creation but it is removed at this point
            if(guards[i] === null){
                methods.splice(i, 1);

            } else if(typeof guards[i] !== 'function'){
                throw new Error(`Only functions can be added as guards. Element ${i}`
                    + ` of event: ${ifScope.event} is of type: ${typeof guards[i]}!`);
            }
        }

        let _Conditional = {};
        let _methodRunner = MethodRunner(ifScope).apply(null, methods);

        ifScope.addChild(_Conditional);

        _Conditional.run = (data, app, next) => {
            data.debug.type = 'guard';
            for(let i = 0, l = guards.length, guard, isTrue; i < l; i++) {
                guard = guards[i];
                isTrue = guard(data, app);
                _isInverted && (isTrue = !isTrue);

                data.debug.isLoggable && data.debug.addToStack(log(data, guard, isTrue));

                if(!isTrue) {
                    return next();
                }
            }

            data.debug.increaseDepth();

            _methodRunner.run(data, app, ()=> {
                ifScope.completeScope();
                data.debug.decreaseDepth();
                next();
            });
        };

        let ret     = DoWrapper(ifScope.parent);
        ret.do      = ret;

        ret.if      = IfWrapper(ifScope.parent);
        ret.elseif  = Conditional(ifScope);
        ret.else    = Conditional(ifScope)(()=>true);

        // TODO - dont like this implementation of else

        return ret;
    };

    _internals.not = (...guards) => {
        _isInverted = true;
        return _internals.apply(null, guards);
    };

    return _internals;
};


const Flow = scope => (...methods: FlowFunction[]) => {

  // make sure there are no undefined etc.
  for(let i = methods.length - 1; i >= 0; i--){
    // we allow for null to be added for the sake of conditional
    // scope creation but it is removed at this point
    if(methods[i] === null){
      methods.splice(i, 1);

    } else if(typeof methods[i] !== 'function'){
      throw new Error(`Only functions or null can be added to a Flow. Element ${i}`
        + ` of event: ${scope.event} is of type: ${typeof methods[i]}!`);
    }
  }

  const run = (data, app, next) => {
    let iterator = Iterator(methods);

    let loop = async () => {
      if(!iterator.hasNext()) return next();
      let method = iterator.next();
      try {
        switch (method.length) {
          case 1:
            data.debug.type = 'scope';
            data.debug.isLoggable && data.debug.addToStack(log(data, method));
            // remove scope creation methods and add scope hierarchy
            // to the main structure to increase speed on later runs

            // TODO - now the whole thing is a new scope every time
            // so this doesn't make sense unless we start caching

            //iterator.removeLastIndex();
            const newScope = Scope(scope.event, scope.data, scope.app);

            //scope.addChild(newScope);

            // as our method is a scope we must pass a ChoiceWrapper
            // through with it as thats where the useful methods are.
            method(ChoiceWrapper(newScope));
            data.debug.increaseDepth();
            newScope.run(data, app, () => {
                data.debug.decreaseDepth();
                loop();
            });
            break;

          case 2:
            data.debug.type = 'function';
            data.debug.isLoggable && data.debug.addToStack(log(data, method));
            await method(data, app);
            loop();
            break;

          case 3:
            data.debug.type = 'next function';
            data.debug.isLoggable && data.debug.addToStack(log(data, method));
            method(data, app, loop);
            break;

          default:
            throw new Error('Reflow middleware must accept 1-3 arguments!');
        }
      } catch (err){
        data.debug.isLoggable && data.debug.addToStack(log(data, method));
        console.log(' ');
        method && console.log(`!!!!!! There has been an error @${method.name}!!!!!!!`);
        console.log(`reflow stack for event: ${data.event}`);
        console.log(err.message);
        data.debug.logStack();
        console.log('\n JS stack:');
        console.log(err);
      }
    };
    loop();
  };

  return Object.freeze({
    run
  });
};

export default {
    Scope,
    ChoiceWrapper
};
