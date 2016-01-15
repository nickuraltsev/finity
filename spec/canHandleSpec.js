import StateMachine from '../src';

describe('canHandle', () => {
  it('returns true when event can be handled', () => {
    const stateMachine = StateMachine
      .configure()
      .initialState('state1').on('event1').transitionTo('state2')
      .start();

    expect(stateMachine.canHandle('event1')).toBe(true);
  });

  it('returns false when event cannot be handled', () => {
    const stateMachine = StateMachine
      .configure()
      .initialState('state1')
      .start();

    expect(stateMachine.canHandle('event1')).toBe(false);
  });
});
