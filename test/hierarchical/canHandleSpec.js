import Finity from '../../src';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describeForAllTagTypes('heirarchial canHandle', () => {
  let stateMachine;

  beforeEach(async () => {
    const grandchildConfig = Finity
      .configure()
        .initialState(tagFor('state111'))
        .on(tagFor('event3')).transitionTo(tagFor('state112'))
      .getConfig();

    const childConfig = Finity
      .configure()
        .initialState(tagFor('state11'))
          .submachine(grandchildConfig)
          .on(tagFor('event2')).transitionTo(tagFor('state12'))
      .getConfig();

    stateMachine = await Finity
      .configure()
        .initialState(tagFor('state1'))
          .submachine(childConfig)
          .on(tagFor('event1')).transitionTo(tagFor('state2'))
      .start();
  });

  it('returns true when the event can be handled by a descendant state machine', async () => {
    expect(await stateMachine.canHandle(tagFor('event3'))).toBe(true);
  });

  it('returns true when the event can be handled by an ancestor state machine', async () => {
    expect(await stateMachine
      .getSubmachine()
      .getSubmachine()
      .canHandle(tagFor('event1'))
    ).toBe(true);
  });

  it('returns false when the event cannot be handled by any state machine in the hierarchy', async () => {
    expect(await stateMachine
      .getSubmachine()
      .canHandle('non-handleable')
    ).toBe(false);
  });
});
