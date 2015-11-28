'use strict';

import delegateToAncestor from './delegateToAncestor';
import StateConfigurator from './StateConfigurator';
import EventConfigurator from './EventConfigurator';
import ChildConfigurator from './ChildConfigurator';

@delegateToAncestor(StateConfigurator, EventConfigurator)
export default class TransitionConfigurator extends ChildConfigurator {
  constructor(parent, targetState, isInternal) {
    super(parent);
    this.config = Object.create(null);
    this.config.targetState = targetState;
    this.config.isInternal = targetState === null && isInternal;
    this.config.actions = [];
  }

  withAction(action) {
    this.config.actions.push(action);
    return this;
  }

  withCondition(condition) {
    this.config.condition = condition;
    return this;
  }
}
