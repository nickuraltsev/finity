# fluent-state-machine

[![npm version](https://badge.fury.io/js/fluent-state-machine.svg)](https://badge.fury.io/js/fluent-state-machine)

A finite state machine library

## Installation

Install using [npm](https://www.npmjs.org/):

```
npm install fluent-state-machine
```

## Example

```javascript
import StateMachine from 'fluent-state-machine';

const maxAttempts = 3;
let attemptCount = 0;

// Create a new state machine which controls the execution of some asynchronous operation.
// This state machine will begin in the 'ready' state. When the 'run' event is received, it will
// transition to the 'running' state and start the async operation
const stateMachine = StateMachine
  .configure()
    .initialState('ready')
      .on('run').transitionTo('running')
      .on('cancel').transitionTo('cancelled')
    .state('running')
      .onEnter(() => {
        attemptCount++;
        startAsyncOperation();
      })
      .on('success').transitionTo('succeeded')
      .on('cancel').transitionTo('cancelled').withAction(cancelAsyncOperation)
      .on('error')
        .selfTransition().withCondition(() => attemptCount < maxAttempts)
        .transitionTo('failed')
    .global()
      .onStateEnter(state => console.log(`Entering state '${state}'`))
  .start();
    
let timer;

function startAsyncOperation() {
  // Simulate an async operation
  timer = setTimeout(() => stateMachine.handle('success'), 3000);
}

function cancelAsyncOperation() {
  clearTimeout(timer);
}

// Fire the 'run' event to start execution
stateMachine.handle('run');

// Fire the 'cancel' event after one second delay
setTimeout(() => stateMachine.handle('cancel'), 1000);
```

## License

[MIT](https://github.com/nickuraltsev/fluent-state-machine/blob/master/LICENSE)
