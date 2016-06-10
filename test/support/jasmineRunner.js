import Jasmine from 'jasmine';
import SpecReporter from 'jasmine-spec-reporter';
import path from 'path';

const jasmine = new Jasmine();
jasmine.loadConfigFile(path.join(__dirname, 'jasmine.json'));
jasmine.addReporter(new SpecReporter({
  displayStacktrace: 'specs',
}));
jasmine.execute();
