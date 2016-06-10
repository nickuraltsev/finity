import Finity from 'finity';
import { Promise } from 'es6-promise';

enum State {
  Ready,
  Running,
  Succeeded,
  Failed,
  TimedOut
}

enum Event {
  TaskCreated
}

function executeTaskAsync(taskSpec: any) {
  // Simulate an async operation
  return new Promise(resolve => setTimeout(resolve, taskSpec.delay));
}

const worker = Finity
  .configure<State, Event>()
    .initialState(State.Ready)
      .on(Event.TaskCreated).transitionTo(State.Running)
    .state(State.Running)
      .do((state, context) => executeTaskAsync(context.eventPayload))
        .onSuccess().transitionTo(State.Succeeded)
        .onFailure().transitionTo(State.Failed)
      .onTimeout(1000)
        .transitionTo(State.TimedOut)
    .global()
      .onStateEnter(state => console.log(`Entering state '${State[state]}'`))
  .start();

const taskSpec = {
  delay: 500,
};
worker.handle(Event.TaskCreated, taskSpec);
