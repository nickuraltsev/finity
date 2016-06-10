import { StateMachineConfigurator } from './configuration';
import StateMachine from './core/StateMachine';

export function configure() {
  return new StateMachineConfigurator();
}

export function start(config) {
  return StateMachine.start(config);
}

export default {
  configure,
  start,
};
