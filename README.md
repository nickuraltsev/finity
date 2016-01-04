# fluent-state-machine

[![npm version](https://badge.fury.io/js/fluent-state-machine.svg)](https://badge.fury.io/js/fluent-state-machine)
[![Build Status](https://api.travis-ci.org/nickuraltsev/fluent-state-machine.svg?branch=master)](https://travis-ci.org/nickuraltsev/fluent-state-machine)
[![Coverage Status](https://coveralls.io/repos/nickuraltsev/fluent-state-machine/badge.svg?branch=master&service=github)](https://coveralls.io/github/nickuraltsev/fluent-state-machine?branch=master)

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

// Create a state machine which controls the execution of some asynchronous operation.
// If the operation fails, it will be retried until it succeeds or the number of attempts reaches the limit.
// If a cancellation request is received, the operation will be cancelled.
const stateMachine = StateMachine
  .configure()
    .initialState('ready')
      .on('run').transitionTo('running')
      .on('cancel').transitionTo('cancelled')
    .state('running')
      .onEnter(() => {
        attemptCount++;
        // ... start the async operation
      })
      .on('success').transitionTo('succeeded')
      .on('cancel').transitionTo('cancelled').withAction(() => {
        // ... cancel the async operation
      })
      .on('error')
        .selfTransition().withCondition(() => attemptCount < maxAttempts)
        .transitionTo('failed')
    .global()
      .onStateEnter(state => console.log(`Entering state ${state}.`))
  .start();

// Send the 'run' event to the state machine to start execution
stateMachine.handle('run');

// Send the 'cancel' event to the state machine to cancel execution
stateMachine.handle('cancel');
```

## Usage

### Configuration

Before you can create and start a state machine, you need to create a state machine configuration. To do this, first call the `StateMachine.configure` method, which is the entry point for the configuration DSL. Then use the DSL to define states, transitions, entry and exit actions, and so on.

#### States

To define the initial state, use the `initialState` method. To add other states, use the `state` method. Both methods take the state name as the parameter.

```javascript
StateMachine
  .configure()
    .initialState('state1')
    .state('state2')
```

A state machine must have one and only one initial state.

#### Transitions

To add a transition to a state, first call the `on` method, passing in the name of the event that triggers the transition. Then call the `transitionTo` method, passing in the name of the target state.

```javascript
StateMachine
  .configure()
    .initialState('state1')
      .on('eventA').transitionTo('state2')
      .on('eventB').transitionTo('state3')
    .state('state2')
      .on('eventC').transitionTo('state1')
```

#### Entry and exit actions

A state can have entry and exit actions, which are executed when the state machine is entering or exiting the state, respectively. To add an entry action to a state, use the `onEnter` method. To add an exit action, use the `onExit` method.

```javascript
StateMachine
  .configure()
    .initialState('state1')
      .onEnter(state => console.log(`Entering state ${state}`))
      .onExit(state => console.log(`Exiting state ${state}`))
      .on('eventA').transitionTo('state2')
```

You can add multiple entry actions to a state. They will be executed in the same order as they have been added. The same is true for exit actions.

#### Transition actions

Transition actions are executed after the exit actions of the source state and before the entry actions of the target state. To add an action to a transition, use the `withAction` method.

```javascript
StateMachine
  .configure()
    .initialState('state1')
      .on('eventA')
        .transitionTo('state2')
          .withAction((fromState, toState) => console.log(`Transitioning from ${fromState} to ${toState}`))
```

You can add multiple actions to a transition. They will be executed in the same order as they have been added.

#### Guard conditions

A transition can have a guard condition. To set a guard condition for a transition, use the `withCondition` method.

```javascript
StateMachine
  .configure()
    .initialState('state1')
      .on('eventA')
        .transitionTo('state2').withCondition(() => new Date().getHours() < 12)
        .transitionTo('state3')
```

A transition cannot have more than one guard condition.

#### Self-transitions and internal transitions

Self-transitions and internal transitions are transitions from a state to itself.

When a self-transition is executed, the state is exited and re-entered, and thus the entry and exit actions are executed. In contrast, an internal transition does not cause exit and reentry to the state.

To add a self-transition to a state, use the `selfTransition` method. To add an internal transition, call the `internalTransition` method.

```javascript
StateMachine
  .configure()
    .initialState('state1')
      .on('eventA').selfTransition()
      .on('eventB').internalTransition()
```

Self-transitions and internal transitions can have actions and guard conditions.

#### Global handlers

```javascript
StateMachine
  .configure()
    .initialState('state1')
      .on('eventA').transitionTo('state2')
    .global()
      .onStateEnter(state => console.log(`Entering state ${state}`))
      .onStateExit(state => console.log(`Exiting state ${state}`))
      .onStateChange((oldState, newState) => console.log(`Changing state from ${oldState} to ${newState}`))
      .onTransition((fromState, toState) => console.log(`Transitioning from ${fromState} to ${toState}`))
```

You can register multiple handlers of the same type. They will be executed in the same order as they have been registered.

```javascript
StateMachine
  .configure()
    .initialState('state1')
    .global()
      .onStateEnter(state => console.log(`Entering state ${state}`))
      .onStateEnter(state => console.log('We are almost there!'))
```

#### Unhandled events

By default, if a state machine receives an event that it cannot handle, it will throw an error. You can override this behavior by setting a custom `onUnhandledEvent` handler.

```javascript
StateMachine
  .configure()
    .initialState('state1')
    .global()
      .onUnhandledEvent((event, state) => console.log(`Unhandled event ${event} in state ${state}.`))
```

You can register multiple `onUnhandledEvent` handlers. They will be executed in the same order as they have been registered.

### Creating and starting a state machine

Once you have created a configuration, you can create and start a state machine. There are two ways to do this. The easiest way is to call the `start` method of the configuration API.

```javascript
const stateMachine = StateMachine
  .configure()
    .initialState('state1')
  .start();
```

If you don't want to start a state machine right away or you need to create multiple instances of a state machine with the same configuration, you can call the `getConfig` method to get the configuration first. Then you can create and start new state machine instances by passing the configuration to the `StateMachine.start` method.

```javascript
const config = StateMachine
  .configure()
    .initialState('state1')
  .getConfig();

const firstInstance = StateMachine.start(config);
const secondInstance = StateMachine.start(config);
```

When a state machine is started, it enters the initial state and all the `onStateEnter` handlers and the initial state's entry actions (if any) are executed. However, the `onTransition` and `onStateChange` handlers are not executed.

### Sending an event to a state machine

To send an event to a state machine, pass the event name to the `handle` method of the state machine object.

```javascript
const stateMachine = StateMachine
  .configure()
    .initialState('state1')
      .on('eventA').transitionTo('state2')
    .state('state2')
      .onEnter(() => console.log('Yay, we did it!'))
  .start();

// This will trigger a transition from state1 to state2.
stateMachine.handle('eventA');
```

If a state machine cannot handle the specified event, it will throw an error or execute the `onUnhandledEvent` handlers if any are registered (see [Unhandled events](#unhandled-events)).

You can check whether a state machine can handle a given event via the `canHandle` method.

```javascript
const stateMachine = StateMachine
  .configure()
    .initialState('state1')
      .on('eventA').transitionTo('state2')
  .start();

console.log(stateMachine.canHandle('eventA')); // true
console.log(stateMachine.canHandle('eventB')); // false
```

### Getting the current state of a state machine

To get the current state of a state machine, call the `getCurrentState` method on the state machine object.

```javascript
const stateMachine = StateMachine
  .configure()
    .initialState('state1')
  .start();

console.log(stateMachine.getCurrentState()); // state1
```

## License

[MIT](https://github.com/nickuraltsev/fluent-state-machine/blob/master/LICENSE)
