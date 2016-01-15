const handlerNames = [
  'stateEnterHandler',
  'stateExitHandler',
  'stateChangeHandler',
  'transitionHandler',
  'entryAction',
  'exitAction',
  'transitionAction'
];

export default class HandlerMocks {
  constructor() {
    handlerNames.forEach(name => this[name] = jasmine.createSpy(name));
  }

  reset() {
    handlerNames.forEach(name => this[name].calls.reset());
  }
}
