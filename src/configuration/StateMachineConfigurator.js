import BaseConfigurator from './BaseConfigurator';
import GlobalConfigurator from './GlobalConfigurator';
import StateConfigurator from './StateConfigurator';
import HierarchicalStateMachine from '../core/HierarchicalStateMachine';

export default class StateMachineConfigurator extends BaseConfigurator {
  constructor() {
    super();
    this.config = {
      global: new GlobalConfigurator(this),
      initialState: null,
      states: new Map(),
    };
  }

  global() {
    return this.config.global;
  }

  initialState(state) {
    this.config.initialState = state;
    return this.state(state);
  }

  state(state) {
    if (!this.config.states.has(state)) {
      this.config.states.set(state, new StateConfigurator(this));
    }
    return this.config.states.get(state);
  }

  getConfig() {
    return this.buildConfig();
  }

  start() {
    const config = this.getConfig();
    return HierarchicalStateMachine.start(config);
  }
}
