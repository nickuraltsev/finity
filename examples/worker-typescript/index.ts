import Finity from 'finity';

enum State {
  Ready,
  Running,
  Succeeded,
  Failed,
  TimedOut
}

enum Event {
  TaskSumbitted
}

function processTaskAsync(taskParams: any) {
  console.log('Processing task:', taskParams);
  // Simulate an async operation
  return new Promise(resolve => setTimeout(resolve, 100));
}

const worker = Finity
  .configure<State, Event>()
    .initialState(State.Ready)
      .on(Event.TaskSumbitted).transitionTo(State.Running)
    .state(State.Running)
      .do((state, context) => processTaskAsync(context.eventPayload))
        .onSuccess().transitionTo(State.Succeeded)
        .onFailure().transitionTo(State.Failed)
      .onTimeout(1000)
        .transitionTo(State.TimedOut)
    .global()
      .onStateEnter(state => console.log(`Entering state '${State[state]}'`))
  .start();

const taskParams = {
  foo: 'bar',
};
worker.handle(Event.TaskSumbitted, taskParams);
