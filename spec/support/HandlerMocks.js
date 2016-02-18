const handlerNames = [
  'onStateEnterHook',
  'onStateExitHook',
  'onTransitionHook',
  'onStateChangeHook',
  'stateEntryAction',
  'stateExitAction',
  'transitionAction',
];

export default class HandlerMocks {
  constructor() {
    this.calledHandlers = [];
    handlerNames.forEach(name =>
      this[name] = jasmine.createSpy(name).and.callFake((...args) =>
        this.calledHandlers.push([name, ...args])
      )
    );
  }

  reset() {
    handlerNames.forEach(name => this[name].calls.reset());
    this.calledHandlers = [];
  }
}
