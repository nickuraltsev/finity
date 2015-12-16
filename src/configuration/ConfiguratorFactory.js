import StateMachineConfigurator from './StateMachineConfigurator';
import GlobalConfigurator from './GlobalConfigurator';
import StateConfigurator from './StateConfigurator';
import EventConfigurator from './EventConfigurator';
import TransitionConfigurator from './TransitionConfigurator';

function createFactory(methodToTypeMap) {
  const factory = {};
  Object.keys(methodToTypeMap).forEach(method => {
    const Type = methodToTypeMap[method];
    factory[method] = function (...args) {
      return new Type(this, ...args);
    };
  });
  return factory;
}

export default createFactory({
  createStateMachineConfigurator: StateMachineConfigurator,
  createGlobalConfigurator: GlobalConfigurator,
  createStateConfigurator: StateConfigurator,
  createEventConfigurator: EventConfigurator,
  createTransitionConfigurator: TransitionConfigurator,
});
