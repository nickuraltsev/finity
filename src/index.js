'use strict';

import StateMachine from './StateMachine';
import StateMachineBuilder from './StateMachineBuilder';

export default {
  getBuilder() {
    return new StateMachineBuilder();
  },

  start: StateMachine.start
};
