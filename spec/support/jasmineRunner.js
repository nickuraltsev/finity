import Jasmine from 'jasmine';
import SpecReporter from 'jasmine-spec-reporter';

const jasmine = new Jasmine();
jasmine.loadConfigFile();
jasmine.addReporter(new SpecReporter());
jasmine.execute();
