import TriggerConfigurator from './TriggerConfigurator';

export default class TimerConfigurator extends TriggerConfigurator {
  constructor(parent, timeout) {
    super(parent);
    this.config.timeout = timeout;
  }
}
