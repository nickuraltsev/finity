const Jasmine = require('jasmine');
const SpecReporter = require('jasmine-spec-reporter');
const path = require('path');

const jasmine = new Jasmine();
jasmine.loadConfigFile(path.join(__dirname, 'jasmine.json'));
jasmine.addReporter(new SpecReporter({
  displayStacktrace: 'specs',
}));
jasmine.execute();
