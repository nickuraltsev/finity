const Finity = require('finity');

function processTaskAsync(taskParams) {
  console.log('Processing task:', taskParams);
  // Simulate an async operation
  return new Promise(resolve => setTimeout(resolve, 100));
}

const worker = Finity
  .configure()
    .initialState('ready')
      .on('task_submitted').transitionTo('running')
    .state('running')
      .do((state, context) => processTaskAsync(context.eventPayload))
        .onSuccess().transitionTo('succeeded')
        .onFailure().transitionTo('failed')
      .onTimeout(1000)
        .transitionTo('timed_out')
    .global()
      .onStateEnter(state => console.log(`Entering state '${state}'`))
  .start();

const taskParams = {
  foo: 'bar',
};
worker.handle('task_submitted', taskParams);
