import Finity from '../../src';

const submachineConfig = Finity
  .configure()
    .initialState('substate1')
  .getConfig();

const stateMachine = Finity
  .configure()
    .initialState('state1')
      .on('event1').transitionTo('state2')
    .state('state2')
      .submachine(submachineConfig)
    .global()
      .onStateEnter(state => console.log(`Entering state '${state}'`))
  .start();

stateMachine.handle('event1');
