import { StateMachineConfigurator } from './configuration';
import HierarchicalStateMachine from './core/HierarchicalStateMachine';

const Finity = {
  configure() {
    return new StateMachineConfigurator();
  },

  async start(config) {
    return await HierarchicalStateMachine.start(config);
  },
};

export default Finity;
