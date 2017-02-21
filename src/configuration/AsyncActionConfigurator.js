import BaseConfigurator from './BaseConfigurator';
import TriggerConfigurator from './TriggerConfigurator';

export default class AsyncActionConfigurator extends BaseConfigurator {
  constructor(parent, action) {
    super(parent);
    this.config = {
      action,
      successTrigger: new TriggerConfigurator(this),
      failureTrigger: new TriggerConfigurator(this),
    };
  }

  onSuccess() {
    return this.config.successTrigger;
  }

  onFailure() {
    return this.config.failureTrigger;
  }
}
