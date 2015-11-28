'use strict';

import ConfiguratorFactory from './configuration/ConfiguratorFactory';
import StateMachine from './StateMachine';

export default {
  configure() {
    return ConfiguratorFactory.createStateMachineConfigurator();
  },

  start: StateMachine.start
};
