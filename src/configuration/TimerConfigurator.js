import TriggerConfigurator from './TriggerConfigurator';

export default class TrimerConfigurator extends TriggerConfigurator {
  constructor(factory, parent, timeout) {
    super(factory, parent, null);
    this.config.timeout = timeout;
  }
}
