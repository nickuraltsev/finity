# Roadmap

## New Features

- [x] Event payloads
- [x] Time triggers
- [x] Promise triggers
- [x] Hierarchical state machines
- [ ] Ignoring events
- [ ] Persistence support

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
