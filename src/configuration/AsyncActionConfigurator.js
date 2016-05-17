import BaseConfigurator from './BaseConfigurator';
import TriggerConfigurator from './TriggerConfigurator';
import deepCopy from '../utils/deepCopy';

export default class AsyncActionConfigurator extends BaseConfigurator {
  constructor(parent, action) {
    super(parent);
    this.config = {
      action,
    };
    this.successConfigurator = new TriggerConfigurator(this);
    this.failureConfigurator = new TriggerConfigurator(this);
  }

  onSuccess() {
    return this.successConfigurator;
  }

  onFailure() {
    return this.failureConfigurator;
  }

  getConfig() {
    const config = deepCopy(this.config);
    config.onSuccess = this.successConfigurator.getConfig();
    config.onFailure = this.failureConfigurator.getConfig();
    return config;
  }
}
