import Finity, { StateMachine } from '../../';

enum State { S1, S2 }
enum Event { E1, E2 }

(async ()=>{
  const stateMachine: StateMachine<State, Event> =
    await Finity
      .configure<State, Event>()
        .initialState(State.S1)
          .on(Event.E1).transitionTo(State.S2)
        .state(State.S2)
          .on(Event.E2).transitionTo(State.S1)
      .start();

  await stateMachine.handle(Event.E1);
  await stateMachine.handle(Event.E2, { foo: 'bar' });

  const canHandle1: boolean = await stateMachine.canHandle(Event.E1);
  const canHandle2: boolean = await stateMachine.canHandle(Event.E2, { foo: 'bar' });

  const currentState: State = stateMachine.getCurrentState();
})();