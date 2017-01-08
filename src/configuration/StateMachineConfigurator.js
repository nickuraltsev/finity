import BaseConfigurator from './BaseConfigurator';
import GlobalConfigurator from './GlobalConfigurator';
import StateConfigurator from './StateConfigurator';
import HierarchicalStateMachine from '../core/HierarchicalStateMachine';
import { mapToConfig } from './ConfiguratorHelper';
import deepCopy from '../utils/deepCopy';
import merge from '../utils/merge';

export default class StateMachineConfigurator extends BaseConfigurator {
  constructor() {
    super();
    this.config = {
      initialState: null,
    };
    this.globalConfigurator = new GlobalConfigurator(this);
    this.stateConfigurators = Object.create(null);
  }

  global() {
    return this.globalConfigurator;
  }

  initialState(state) {
    this.config.initialState = state;
    return this.state(state);
  }

  state(state) {
    if (!this.stateConfigurators[state]) {
      this.stateConfigurators[state] = new StateConfigurator(this);
    }
    return this.stateConfigurators[state];
  }

  getConfig() {
    const config = deepCopy(this.config);
    config.states = mapToConfig(this.stateConfigurators);
    return merge(config, this.globalConfigurator.internalGetConfig());
  }

  start() {
    const config = this.getConfig();
    return HierarchicalStateMachine.start(config);
  }
}
