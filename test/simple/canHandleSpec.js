import Finity from '../../src';

describe('canHandle', () => {
  describe('when there is no transition for the current state and event', () => {
    it('returns false', () => {
      const stateMachine = Finity
        .configure()
        .initialState('state1')
        .start();

      expect(stateMachine.canHandle('event1')).toBe(false);
    });
  });

  describe('when there is a single transition for the current state and event', () => {
    describe('when the transition has no guard condition', () => {
      it('returns true', () => {
        const stateMachine = Finity
          .configure()
          .initialState('state1').on('event1').transitionTo('state2')
          .start();

        expect(stateMachine.canHandle('event1')).toBe(true);
      });
    });

    describe('when the guard condition of the transition is true', () => {
      it('returns true', () => {
        const stateMachine = Finity
          .configure()
          .initialState('state1')
            .on('event1').transitionTo('state2').withCondition(() => true)
          .start();

        expect(stateMachine.canHandle('event1')).toBe(true);
      });
    });

    describe('when the guard condition of the transition is false', () => {
      it('returns false', () => {
        const stateMachine = Finity
          .configure()
          .initialState('state1')
            .on('event1').transitionTo('state2').withCondition(() => false)
          .start();

        expect(stateMachine.canHandle('event1')).toBe(false);
      });
    });
  });

  describe('when there are multiple transitions for the current state and event', () => {
    describe('when one of the transitions has no guard condition', () => {
      it('returns true', () => {
        const stateMachine = Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2').withCondition(() => false)
              .transitionTo('state3')
          .start();

        expect(stateMachine.canHandle('event1')).toBe(true);
      });
    });


    describe('when the guard condition of one of the transitions is true', () => {
      it('returns true', () => {
        const stateMachine = Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2').withCondition(() => false)
              .transitionTo('state3').withCondition(() => true)
          .start();

        expect(stateMachine.canHandle('event1')).toBe(true);
      });
    });

    describe('when the guard condition of each transition is false', () => {
      it('returns false', () => {
        const stateMachine = Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2').withCondition(() => false)
              .transitionTo('state3').withCondition(() => false)
          .start();

        expect(stateMachine.canHandle('event1')).toBe(false);
      });
    });
  });

  it('passes a context object to guard conditions', () => {
    const condition = jasmine.createSpy('condition');

    const stateMachine = Finity
      .configure()
      .initialState('state1')
        .on('event1').transitionTo('state2').withCondition(condition)
      .start();

    stateMachine.canHandle('event1');

    expect(condition).toHaveBeenCalledWith({ stateMachine, event: 'event1' });
  });

  it('adds the event payload to the context object', () => {
    const condition = jasmine.createSpy('condition');

    const stateMachine = Finity
      .configure()
      .initialState('state1')
        .on('event1').transitionTo('state2').withCondition(condition)
      .start();

    stateMachine.canHandle('event1', 'payload1');

    expect(condition).toHaveBeenCalledWith({
      stateMachine,
      event: 'event1',
      eventPayload: 'payload1',
    });
  });
});
