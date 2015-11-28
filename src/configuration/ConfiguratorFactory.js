'use strict';

import StateMachineConfigurator from './StateMachineConfigurator';
import StateConfigurator from './StateConfigurator';
import EventConfigurator from './EventConfigurator';
import TransitionConfigurator from './TransitionConfigurator';

const ConfiguratorFactory = {
  createStateMachineConfigurator() {
    return new StateMachineConfigurator(this);
  },

  createStateConfigurator(parent, config) {
    return new StateConfigurator(parent, config);
  },

  createEventConfigurator(parent, config) {
    return new EventConfigurator(parent, config);
  },

  createTransitionConfigurator(parent, targetState, isInternal) {
    return new TransitionConfigurator(parent, targetState, isInternal);
  }
};

export default ConfiguratorFactory;
