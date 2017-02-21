const Finity = require('finity');

const submachineConfig = Finity
  .configure()
    .initialState('s21')
      .on('eventB').transitionTo('s22')
    .global()
      .onStateEnter(substate => console.log(`  - Entering substate '${substate}'`))
      .onStateExit(substate => console.log(`  - Exiting substate '${substate}'`))
  .getConfig();

const stateMachine = Finity
  .configure()
    .initialState('s1')
      .on('eventA').transitionTo('s2')
    .state('s2')
      .submachine(submachineConfig) // s2 is a submachine state
      .on('eventC').transitionTo('s3')
    .global()
      .onStateEnter(state => console.log(`- Entering state '${state}'`))
      .onStateExit(state => console.log(`- Exiting state '${state}'`))
  .start();

stateMachine.handle('eventA');

stateMachine.handle('eventB');

stateMachine.handle('eventC');
