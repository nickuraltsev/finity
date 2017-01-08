import { StateMachineConfigurator } from './configuration';
import HierarchicalStateMachine from './core/HierarchicalStateMachine';

export function configure() {
  return new StateMachineConfigurator();
}

export function start(config) {
  return HierarchicalStateMachine.start(config);
}

export default {
  configure,
  start,
};
