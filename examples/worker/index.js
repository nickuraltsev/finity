import StateMachine from '../../src';

function executeTaskAsync(taskSpec) {
  // Simulate an async operation
  return new Promise(resolve => setTimeout(resolve, taskSpec.delay));
}

const worker = StateMachine
  .configure()
    .initialState('ready')
      .on('task').transitionTo('running')
    .state('running')
      .do((state, context) => executeTaskAsync(context.eventPayload))
        .onSuccess().transitionTo('succeeded')
        .onFailure().transitionTo('failed')
      .onTimeout(1000)
        .transitionTo('timed_out')
    .global()
      .onStateEnter(state => console.log(`Entering state '${state}'`))
  .start();

const taskSpec = {
  delay: 500,
};
worker.handle('task', taskSpec);
