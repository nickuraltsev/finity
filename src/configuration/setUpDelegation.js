import StateMachineConfigurator from './StateMachineConfigurator';
import GlobalConfigurator from './GlobalConfigurator';
import StateConfigurator from './StateConfigurator';
import TriggerConfigurator from './TriggerConfigurator';
import TransitionConfigurator from './TransitionConfigurator';
import AsyncActionConfigurator from './AsyncActionConfigurator';
import { delegateToAncestor } from './ConfiguratorHelper';

export default function setUpDelegation() {
  delegateToAncestor(GlobalConfigurator, StateMachineConfigurator);
  delegateToAncestor(StateConfigurator, StateMachineConfigurator);
  delegateToAncestor(TransitionConfigurator, StateConfigurator);
  delegateToAncestor(TransitionConfigurator, TriggerConfigurator);
  delegateToAncestor(TransitionConfigurator, AsyncActionConfigurator);
}
