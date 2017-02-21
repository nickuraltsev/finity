import StateMachine from './StateMachine';
import TaskScheduler from './TaskScheduler';

export default class HierarchicalStateMachine {
  constructor(rootStateMachine, currentStateMachine, taskScheduler) {
    this.rootStateMachine = rootStateMachine;
    this.currentStateMachine = currentStateMachine;
    this.taskScheduler = taskScheduler;
  }

  static start(config) {
    const taskScheduler = new TaskScheduler();
    let rootStateMachine;
    const createContext = stateMachine => ({
      stateMachine: new HierarchicalStateMachine(rootStateMachine, stateMachine, taskScheduler),
    });
    rootStateMachine = new StateMachine(config, taskScheduler, createContext);
    taskScheduler.execute(() => rootStateMachine.start());
    return new HierarchicalStateMachine(rootStateMachine, rootStateMachine, taskScheduler);
  }

  getCurrentState() {
    return this.currentStateMachine.getCurrentState();
  }

  getSubmachine() {
    const submachine = this.currentStateMachine.getSubmachine();
    if (submachine) {
      return new HierarchicalStateMachine(this.rootStateMachine, submachine, this.taskScheduler);
    }
    return null;
  }

  getStateHierarchy() {
    return this.getStateMachines()
      .map(stateMachine => stateMachine.getCurrentState());
  }

  canHandle(event, eventPayload) {
    const stateMachines = this.getStateMachines();
    for (let i = stateMachines.length - 1; i >= 0; i--) {
      if (stateMachines[i].canHandle(event, eventPayload)) {
        return true;
      }
    }
    return false;
  }

  handle(event, eventPayload) {
    this.taskScheduler.enqueue(() => {
      const stateMachines = this.getStateMachines();
      for (let i = stateMachines.length - 1; i >= 0; i--) {
        if (stateMachines[i].tryHandle(event, eventPayload)) {
          return;
        }
      }
      this.currentStateMachine.handleUnhandledEvent(event, eventPayload);
    });
    return this;
  }

  getStateMachines() {
    const stateMachines = [];
    let stateMachine = this.rootStateMachine;
    do {
      stateMachines.push(stateMachine);
      stateMachine = stateMachine.getSubmachine();
    } while (stateMachine);
    return stateMachines;
  }

  toString() {
    return `StateMachine(currentState: ${this.getCurrentState()})`;
  }
}
