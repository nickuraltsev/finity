import StateMachine from '../src';
import HandlerMocks from './support/HandlerMocks';

describe('time trigger', () => {
  beforeEach(() => jasmine.clock().install());

  afterEach(() => jasmine.clock().uninstall());

  it('executes transition from initial state', () => {
    const stateMachine = StateMachine
      .configure()
      .initialState('state1').onTimeout(100).transitionTo('state2')
      .start();

    expect(stateMachine.getCurrentState()).toBe('state1');

    jasmine.clock().tick(100);

    expect(stateMachine.getCurrentState()).toBe('state2');
  });

  it('executes transition from a non-initial state', () => {
    const stateMachine = StateMachine
      .configure()
      .initialState('state1').on('event1').transitionTo('state2')
      .state('state2').onTimeout(100).transitionTo('state3')
      .start()
      .handle('event1');

    expect(stateMachine.getCurrentState()).toBe('state2');

    jasmine.clock().tick(100);

    expect(stateMachine.getCurrentState()).toBe('state3');
  });
});
