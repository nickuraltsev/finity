import { StateMachineConfigurator } from './configuration';
import HierarchicalStateMachine from './core/HierarchicalStateMachine';

export default {
  configure() {
    return new StateMachineConfigurator();
  },

  start(config) {
    return HierarchicalStateMachine.start(config);
  },
};
