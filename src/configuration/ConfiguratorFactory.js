'use strict';

import StateMachineConfigurator from './StateMachineConfigurator';
import StateConfigurator from './StateConfigurator';
import EventConfigurator from './EventConfigurator';
import TransitionConfigurator from './TransitionConfigurator';

export default createFactory({
  createStateMachineConfigurator: StateMachineConfigurator,
  createStateConfigurator: StateConfigurator,
  createEventConfigurator: EventConfigurator,
  createTransitionConfigurator: TransitionConfigurator
});

function createFactory(methodToTypeMap) {
  const factory = {};
  Object.keys(methodToTypeMap).forEach(method => {
    const Type = methodToTypeMap[method];
    factory[method] = function(...args) {
      return new Type(this, ...args);
    };
  });
  return factory;
}
