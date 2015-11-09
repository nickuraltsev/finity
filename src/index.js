'use strict';

import StateMachine from './StateMachine';
import StateMachineBuilder from './StateMachineBuilder';

StateMachine.getBuilder = () => new StateMachineBuilder();

export default StateMachine;
