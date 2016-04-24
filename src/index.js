import StateMachineConfigurator from './configuration/StateMachineConfigurator';
import StateMachine from './StateMachine';

export default {
  configure: () => new StateMachineConfigurator(),
  start: StateMachine.start,
};
