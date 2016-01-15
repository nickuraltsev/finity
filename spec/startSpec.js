import StateMachine from '../src';
import HandlerMocks from './support/HandlerMocks';

describe('start', () => {
  it('starts state machine', () => {
    const stateMachine = StateMachine
      .configure()
      .initialState('state1')
      .start();

    expect(stateMachine.getCurrentState()).toBe('state1');
  });

  it('calls handlers with correct parameters', () => {
    const mocks = new HandlerMocks();

    const stateMachine = StateMachine
      .configure()
      .global().onStateEnter(mocks.stateEnterHandler)
      .initialState('state1').onEnter(mocks.entryAction)
      .start();

    const context = { stateMachine };
    expect(mocks.stateEnterHandler).toHaveBeenCalledWith('state1', context);
    expect(mocks.entryAction).toHaveBeenCalledWith('state1', context);
  });

  it('does not call stateChange handler', () => {
    const stateChangeHandler = jasmine.createSpy();

    StateMachine
      .configure()
      .global().onStateChange(stateChangeHandler)
      .initialState('state1')
      .start();

    expect(stateChangeHandler).not.toHaveBeenCalled();
  });

  it('throws if configuration is undefined', () => {
    expect(() => StateMachine.start())
      .toThrowError('Configuration must be specified.');
  });

  it('throws if configuration is null', () => {
    expect(() => StateMachine.start(null))
      .toThrowError('Configuration must be specified.');
  });

  it('throws if configuration is not an object', () => {
    expect(() => StateMachine.start(100))
      .toThrowError('Configuration must be an object.');
  });
});
