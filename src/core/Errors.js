export class UnhandledEventError extends Error {
  constructor(event, state, context) {
    super(`Unhandled event '${event.toString()}' in state '${state.toString()}'.`);
    this.event = event;
    this.state = state;
    this.context = context;
  }
}

export class StateMachineNotStartedError extends Error {
  constructor(stateMachine) {
    super('Cannot handle events before starting the state machine!');
    this.stateMachine = stateMachine;
  }
}

export class StateMachineConfigError extends Error {}
