import TriggerConfigurator from './TriggerConfigurator';
import merge from '../utils/merge';

export default class TrimerConfigurator extends TriggerConfigurator {
  constructor(parent, timeout) {
    super(parent);
    this.config = {
      timeout,
    };
  }

  internalGetConfig() {
    return merge(super.internalGetConfig(), this.config);
  }
}
