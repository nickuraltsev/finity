import Finity from '../../src';

describe('canHandle', () => {
  it('returns true if the event can be handled by a descendant state machine', () => {
    const grandchildConfig = Finity
      .configure()
        .initialState('state111')
          .submachine()
          .on('event1').transitionTo('state112')
      .getConfig();

    const childConfig = Finity
      .configure()
        .initialState('state11')
          .submachine(grandchildConfig)
      .getConfig();

    const stateMachine = Finity
      .configure()
        .initialState('state1')
          .submachine(childConfig)
      .start();

    expect(stateMachine.canHandle('event1')).toBe(true);
  });

  it('returns true if the event can be handled by an ancestor state machine', () => {
    const grandchildConfig = Finity
      .configure()
        .initialState('state111')
          .submachine()
      .getConfig();

    const childConfig = Finity
      .configure()
        .initialState('state11')
          .submachine(grandchildConfig)
      .getConfig();

    const stateMachine = Finity
      .configure()
        .initialState('state1')
          .submachine(childConfig)
          .on('event1').transitionTo('state2')
      .start();

    expect(stateMachine
      .getSubmachine('state1')
      .getSubmachine('state11')
      .canHandle('event1')
    ).toBe(true);
  });
});
