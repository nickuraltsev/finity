import ConfiguratorFactory from './configuration/ConfiguratorFactory';
import StateMachine from './StateMachine';

export default {
  configure: ::ConfiguratorFactory.createStateMachineConfigurator,
  start: StateMachine.start
};
