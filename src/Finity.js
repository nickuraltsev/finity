import { StateMachineConfigurator } from './configuration';
import HierarchicalStateMachine from './core/HierarchicalStateMachine';

const Finity = {
  configure() {
    return new StateMachineConfigurator();
  },

  start(config) {
    return HierarchicalStateMachine.start(config);
  },
};

export default Finity;
