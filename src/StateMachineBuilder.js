'use strict';

import StateMachine from './StateMachine';

export default class StateMachineBuilder {
  constructor(config) {
    this.config = config || StateMachineBuilder.createConfig();
  }

  onStateEnter(handler) {
    this.config.stateEnterHandlers.push(handler);
    return this;
  }

  onStateExit(handler) {
    this.config.stateExitHandlers.push(handler);
    return this;
  }

  onTransition(handler) {
    this.config.transitionHandlers.push(handler);
    return this;
  }

  onUnhandledEvent(handler) {
    this.config.unhandledEventHandlers.push(handler);
    return this;
  }

  initialState(state) {
    this.config.initialState = state;
    return this.state(state);
  }

  state(state) {
    const stateBuilder = new StateBuilder(this, this.config.states[state]);
    this.config.states[state] = stateBuilder.config;
    return stateBuilder;
  }

  getConfiguration() {
    return this.config;
  }

  build() {
    return new StateMachine(this.config);
  }

  static createConfig() {
    const config = Object.create(null);
    config.states = Object.create(null);
    config.stateEnterHandlers = [];
    config.stateExitHandlers = [];
    config.transitionHandlers = [];
    config.unhandledEventHandlers = [];
    return config;
  }
}

class ChildBuilder {
  constructor(parent) {
    this.parent = parent;
  }

  getAncestor(type) {
    return this.parent instanceof type
      ? this.parent
      : this.parent.getAncestor && this.parent.getAncestor(type);
  }
}

@delegateToAncestor(StateMachineBuilder)
class StateBuilder extends ChildBuilder {
  constructor(parent, config) {
    super(parent);
    this.config = config || StateBuilder.createConfig();
  }

  onEnter(action) {
    this.config.entryActions.push(action);
    return this;
  }

  onExit(action) {
    this.config.exitActions.push(action);
    return this;
  }

  on(event) {
    const eventBuilder = new EventBuilder(this, this.config.events[event]);
    this.config.events[event] = eventBuilder.config;
    return eventBuilder;
  }

  static createConfig() {
    const config = Object.create(null);
    config.entryActions = [];
    config.exitActions = [];
    config.events = Object.create(null);
    return config;
  }
}

class EventBuilder extends ChildBuilder {
  constructor(parent, config) {
    super(parent);
    this.config = config || EventBuilder.createConfig();
  }

  transition(targetState, isInternal) {
    const transitionBuilder = new TransitionBuilder(this, targetState, isInternal);
    this.config.transitions.push(transitionBuilder.config);
    return transitionBuilder;
  }

  selfTransition() {
    return this.transition(null, false);
  }

  internalTransition() {
    return this.transition(null, true);
  }

  static createConfig() {
    const config = Object.create(null);
    config.transitions = [];
    return config;
  }
}

@delegateToAncestor(StateBuilder, EventBuilder)
class TransitionBuilder extends ChildBuilder {
  constructor(parent, targetState, isInternal) {
    super(parent);
    this.config = Object.create(null);
    this.config.targetState = targetState;
    this.config.isInternal = targetState === null && isInternal;
    this.config.actions = [];
  }

  withAction(action) {
    this.config.actions.push(action);
    return this;
  }

  withCondition(condition) {
    this.config.condition = condition;
    return this;
  }
}

function delegateToAncestor(...ancestorTypes) {
  return currentType =>
    ancestorTypes.forEach(ancestorType =>
      Object.getOwnPropertyNames(ancestorType.prototype)
        .filter(name =>
          ancestorType.prototype[name] instanceof Function &&
          ancestorType.prototype[name] !== ancestorType.prototype.constructor
        )
        .forEach(name =>
          currentType.prototype[name] = function() {
            return ancestorType.prototype[name].apply(this.getAncestor(ancestorType), arguments);
          }
        )
    );
}
