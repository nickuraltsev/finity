# Roadmap

## New Features

- [x] Event payloads
- [x] Time triggers
- [x] Promise triggers
- [ ] Hierarchical state machines *(in progress)*
- [ ] Ignoring events
- [ ] Persistence support

### Hierarchical state machines

```javascript
const submachineConfig = Finity
  .configure()
    .initialState('substate2A')
      .on('event2').transitionTo('substate2B')
  .getConfig();
  
const stateMachine = Finity
  .configure()
    .initialState('state1')
      .on('event1').transitionTo('state2')
    .state('state2')
      .on('event3').transitionTo('state3')
      .submachine(submachineConfig)
  .start();
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
- [ ] Project website *(in progress)*
- [ ] Clarify that final states don't need to be explicitly defined
- [ ] Execution order of entry, exit, and transition actions and global hooks
- [ ] Recursive events & event queue
- [ ] API reference
