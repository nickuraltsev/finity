import StateMachine from './StateMachine';
import TaskScheduler from './TaskScheduler';

export default class HierarchicalStateMachine {
  constructor(rootStateMachine, currentStateMachine, taskScheduler) {
    this.rootStateMachine = rootStateMachine;
    this.currentStateMachine = currentStateMachine;
    this.taskScheduler = taskScheduler;
  }

  static async start(config) {
    const taskScheduler = new TaskScheduler();
    let rootStateMachine;
    const createContext = stateMachine => ({
      stateMachine: new HierarchicalStateMachine(rootStateMachine, stateMachine, taskScheduler),
    });
    rootStateMachine = new StateMachine(config, taskScheduler, createContext);
    await taskScheduler.enqueue(() => rootStateMachine.start());
    await taskScheduler.runAll();
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

  async canHandle(event, eventPayload) {
    const stateMachines = this.getStateMachines();
    for (let i = stateMachines.length - 1; i >= 0; i--) {
      // eslint-disable-next-line no-await-in-loop
      if (await stateMachines[i].canHandle(event, eventPayload)) {
        return true;
      }
    }
    return false;
  }

  async handle(event, eventPayload) {
    return await new Promise((resolve, reject) => {
      this.taskScheduler.enqueue(async () => {
        const stateMachines = this.getStateMachines();
        for (let i = stateMachines.length - 1; i >= 0; i--) {
          // eslint-disable-next-line no-await-in-loop
          if (await stateMachines[i].canHandle(event, eventPayload)) {
            // eslint-disable-next-line no-await-in-loop
            return await (stateMachines[i].handle(event, eventPayload));
          }
        }
        return await this.currentStateMachine.handleUnhandledEvent(event, eventPayload);
      }).then(resolve, reject);
    });
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
