# fluent-state-machine

[![npm version](https://badge.fury.io/js/fluent-state-machine.svg)](https://badge.fury.io/js/fluent-state-machine)
[![Build Status](https://api.travis-ci.org/nickuraltsev/fluent-state-machine.svg?branch=master)](https://travis-ci.org/nickuraltsev/fluent-state-machine)

A finite state machine library for Node.js and the browser with a friendly configuration DSL.

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
// If the operation fails, it will be retried until it succeeds or the number of attempts reaches the limit.
// If a cancellation request is recieved, the operation is cancelled.
const stateMachine = StateMachine
  .configure()
    .initialState('ready')
      .on('run').transitionTo('running')
      .on('cancel').transitionTo('cancelled')
    .state('running')
      .onEnter(() => {
        attemptCount++;
        // ... start the async operation here
      })
      .on('success').transitionTo('succeeded')
      .on('cancel').transitionTo('cancelled').withAction(() => {
        // ... cancel the async operation here
      })
      .on('error')
        .selfTransition().withCondition(() => attemptCount < maxAttempts)
        .transitionTo('failed')
    .global()
      .onStateEnter(state => console.log(`Entering state '${state}'`))
  .start();

// Fire the 'run' event to start execution
stateMachine.handle('run');
// Fire the 'cancel' event to cancel execution
stateMachine.handle('cancel');
```

## License

[MIT](https://github.com/nickuraltsev/fluent-state-machine/blob/master/LICENSE)
