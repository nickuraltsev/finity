process.on('unhandledRejection', x => { throw x; });

const Jasmine = require('jasmine');
const SpecReporter = require('jasmine-spec-reporter').SpecReporter;
const path = require('path');

const jasmine = new Jasmine();
jasmine.loadConfigFile(path.join(__dirname, 'jasmine.json'));
jasmine.addReporter(new SpecReporter({
  spec: {
    displayStacktrace: true,
  },
}));
jasmine.execute();
