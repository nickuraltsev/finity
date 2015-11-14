'use strict';

import StateMachine from './StateMachine';

export default class StateMachineBuilder {
  constructor() {
    this.config = Object.create(null);
    this.config.states = Object.create(null);
  }

  onStateEnter(handler) {
    this.config.stateEnterHandler = handler;
    return this;
  }

  onStateExit(handler) {
    this.config.stateExitHandler = handler;
    return this;
  }

  onTransition(handler) {
    this.config.transitionHandler = handler;
    return this;
  }

  onUnhandledEvent(handler) {
    this.config.unhandledEventHandler = handler;
    return this;
  }

  initialState(state) {
    this.config.initialState = state;
    return this.state(state);
  }

  state(state) {
    if (!this.config.states[state]) {
      this.config.states[state] = StateMachineBuilder.createStateConfig();
    }
    return new StateBuilder(this, this.config.states[state]);
  }

  getConfiguration() {
    return this.config;
  }

  build() {
    return new StateMachine(this.config);
  }

  static createStateConfig() {
    const stateConfig = Object.create(null);
    stateConfig.events = Object.create(null);
    return stateConfig;
  }
}

class ChildBuilder {
  constructor(parent, config) {
    this.parent = parent;
    this.config = config;
  }

  getAncestor(type) {
    return this.parent instanceof type
      ? this.parent
      : this.parent.getAncestor && this.parent.getAncestor(type);
  }
}

@delegateToAncestor(StateMachineBuilder)
class StateBuilder extends ChildBuilder {
  onEnter(action) {
    this.config.entryAction = action;
    return this;
  }

  onExit(action) {
    this.config.exitAction = action;
    return this;
  }

  on(event) {
    if (!this.config.events[event]) {
      this.config.events[event] = StateBuilder.createEventConfig();
    }
    return new EventBuilder(this, this.config.events[event]);
  }

  static createEventConfig() {
    const eventConfig = Object.create(null);
    eventConfig.transitions = [];
    return eventConfig;
  }
}

class EventBuilder extends ChildBuilder {
  transition(targetState, isInternal) {
    const transitionConfig = Object.create(null);
    transitionConfig.targetState = targetState;
    transitionConfig.isInternal = targetState === null && isInternal;
    this.config.transitions.push(transitionConfig);
    return new TransitionBuilder(this, transitionConfig);
  }

  selfTransition() {
    return this.transition(null, false);
  }

  internalTransition() {
    return this.transition(null, true);
  }
}

@delegateToAncestor(StateBuilder, EventBuilder)
class TransitionBuilder extends ChildBuilder {
  withAction(action) {
    this.config.action = action;
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
