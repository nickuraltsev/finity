# Roadmap

## New Features

- [x] Event payloads
- [x] Time triggers
- [ ] Promise triggers
- [ ] Hierarchical state machines
- [ ] Ignoring events
- [ ] Persistence support

### Promise triggers

```javascript
.state('state1')
  .do(() => { ... })
    .onSuccess().transitionTo('state2')
    .onFailure().transitionTo('state3')

.state('state1')
  .do(() => { ... })
    .onComplete().transitionTo('state2')

.state('state1')
  .do(() => { ... })
    .onComplete()
      .transitionTo('state2')
        .withAction((fromState, toState, context) => {
          if (context.error) {
            console.log('Error:', context.error);
          } else {
            console.log('Result:', context.result);
          }
        })
```

### Hierarchical state machines

```javascript
.state('state1')
  .on('eventA').transitionTo('state2')
  .submachine()
    .rememberLastState()
    .initialState('substate1')
      .on('eventB').transitionTo('substate2')
    .state('substate2')
      .on('eventC').transitionTo('substate3')
    .parent()
.state('state2')
```

### Ignoring events

```javascript
.state('state1').on('eventA').ignore()
```

### Persistence support

TBD...

## Documentation

- [x] Global hooks
- [x] Clarify how guard conditions work
- [x] Entry, exit, and transition action parameters
- [ ] Project website
- [ ] Clarify that final states don't need to be explicitly defined
- [ ] Execution order of entry, exit, and transition actions and global hooks
- [ ] Recursive events & event queue
- [ ] API reference
