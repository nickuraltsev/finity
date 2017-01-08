import Finity from '../../src';

const handleStateEnter = state => console.log(`Entering state '${state}'`);
const handleStateExit = state => console.log(`Exiting state '${state}'`);

const submachineConfig = Finity
  .configure()
    .initialState('substate2A')
      .on('event2').transitionTo('substate2B')
    .global()
      .onStateEnter(handleStateEnter)
      .onStateExit(handleStateExit)
  .getConfig();

const stateMachine = Finity
  .configure()
    .initialState('state1')
      .on('event1').transitionTo('state2')
    .state('state2')
      .on('event3').transitionTo('state3')
      .submachine(submachineConfig)
    .global()
      .onStateEnter(handleStateEnter)
      .onStateExit(handleStateExit)
  .start();

for (let i = 1; i <= 3; i++) {
  stateMachine.handle(`event${i}`);
}
