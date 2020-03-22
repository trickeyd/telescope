import React, { ComponentType } from 'react'
import { Consumer } from './context'
import { ComponentWrapper } from "./ComponentWrapper";
import { StringToAny } from "../types";
import { Signal } from "../signals/signal";

interface App {
  model: Object
  emit: Function
}

export const connect = (
  mapStateToProps: (modal: any) => StringToAny,
  mapDispatchToProps: () => { [key: string]: Signal<any>
}) =>
  (Component: ComponentType<any>) =>
    (props: StringToAny) => (
      <Consumer>{
        (app) => (
          <ComponentWrapper
            Component={Component}
            passedProps={props}
            app={app}
            mapStateToProps={mapStateToProps}
            mapDispatchToProps={mapDispatchToProps}
          />
        )
      }</Consumer>
    )


/*export default function connect(ReactComponent){

    class ReplanHOC extends Component {


        constructor(props, context){
            super(props, context);

            this._replan = createReplanObject(this);
        }

        componentDidUpdate(prevProps{
            let changedProps = {};
            let changeOccurred = false;
            Object.keys(prevProps).forEach(
                key => {
                    if(prevProps[key] !== this.props[key]){
                        changedProps[key] = this.props[key];
                        changeOccurred = true;
                    }
                }
            );
            if(changeOccurred){
                this.setState(changedProps);
            }
        }

        componentDidMount() {
            proxies.registerInstance(this);

            if(ReplanHOC._startAppOnMount) {
                ReplanHOC._startAppOnMount = false;
                setTimeout(()=>{
                    emitter.emit(replanEvents.APPLICATION_STARTED);
                },1);
            }
        }

        componentWillUnmount() {
            proxies.unregisterInstance(this);
        }

        setProps(props, callback) {
            this.setState(props, callback);
        }

        // TODO - get rid
        setComponentState(state, callback) {
            this._reactComponent && this._reactComponent.setState(state, callback);
        }

        getState() {
            return this._reactComponent.state;
        }

        render(){
            const props = {
                ref: reactComponent => this._reactComponent = reactComponent,
                replan: this._replan,
                ...this.props,
                ...this.state
            };
            return createElement(ReactComponent, props);
        }
    }

    hoistNonReactStatics(ReplanHOC, ReactComponent);

    // register the holder to the name of the react component
    proxies.registerType(ReplanHOC, ReactComponent.name);

    ReplanHOC.displayName = `ReplanHOC(${getDisplayName(ReactComponent)})`;

    return ReplanHOC;
};


function getDisplayName(WrappedComponent) {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

*/
