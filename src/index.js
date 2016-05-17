import { StateMachineConfigurator } from './configuration';
import StateMachine from './core/StateMachine';

export default {
  configure: () => new StateMachineConfigurator(),
  start: StateMachine.start,
};
