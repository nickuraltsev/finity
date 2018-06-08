import Tagger from './Tagger';
import Finity from '../../src';
import toString from '../../src/utils/toString';

const finityTagTypes = {
  BaseConfigurator(key) {
    return Finity.configure().initialState(key);
  },
};

const taggerStack = [new Tagger()];
export function tagFor(key) {
  return taggerStack[taggerStack.length - 1].tagFor(key);
}

function pushShadow(funcStack, shadower, argTransformer) {
  const lastFunc = funcStack[funcStack.length - 1];
  funcStack.push((...args) => lastFunc(...argTransformer(shadower, args)));
}

function shadowerForTagger(tagger) {
  return shadowedBlock => ((...args) => {
    taggerStack.push(tagger);
    const retval = Promise.resolve(shadowedBlock(...args));
    retval.then(() => {
      taggerStack.pop();
    }, () => {
      taggerStack.pop();
    });
    return retval;
  });
}

const shadowMap = new WeakMap();
function shadowFor(func) {
  return shadowMap.get(func);
}
function makeShadow(func, argTransformer = (shadower, [block]) => [shadower(block)]) {
  const funcStack = [func];
  const mapEntry = {
    runShadow(...args) {
      return funcStack[funcStack.length - 1](...args);
    },
    pushShadower(shadower) {
      return pushShadow(funcStack, shadower, argTransformer);
    },
    pushCurrentTagger() {
      return pushShadow(
        funcStack,
        shadowerForTagger(taggerStack[taggerStack.length - 1]),
        argTransformer
      );
    },
    pop() {
      funcStack.pop();
    },
  };
  shadowMap.set(func, mapEntry);
  return mapEntry.runShadow;
}

const shadowIt = makeShadow(it, (shadower, [name, fn, timeout]) => [name, shadower(fn), timeout]);
export { shadowIt as it };

const shadowDescribe = makeShadow(describe, (shadower, [name, fn]) => [name, shadower(fn)]);
export { shadowDescribe as describe };

const shadowBeforeEach = makeShadow(beforeEach);
export { shadowBeforeEach as beforeEach };

const shadowAfterEach = makeShadow(afterEach);
export { shadowAfterEach as afterEach };

export default function forAllTagTypes(fn, block) {
  Tagger.BuiltinTagTypes
    .map(tagType => [tagType, new Tagger(tagType)])
    .concat(Object.entries(finityTagTypes).map(([k, v]) => [k, new Tagger(v)]))
    .forEach(([tagType, tagger]) => fn(tagType,
      (...blockArgs) => {
        taggerStack.push(tagger);
        [describe, it, beforeEach, afterEach].forEach(x => shadowFor(x).pushCurrentTagger());
        const popShadows = val => {
          [describe, it, beforeEach, afterEach].forEach(x => shadowFor(x).pop());
          taggerStack.pop();
          return val;
        };
        let retval;
        let success = false;
        try {
          retval = block(...blockArgs);
          success = true;
        } finally {
          if (!success) popShadows();
        }
        if (retval && retval.then) return retval.then(popShadows);
        popShadows();
        return retval;
      }
    ));
}

export function describeForAllTagTypes(name, block) {
  return describe(name, () => forAllTagTypes((tagType, shadowedBlock) => describe(`when using ${toString(tagType)} tags`, shadowedBlock), block));
}

export function forAllTagTypesIt(name, block) {
  return describe(name, () => forAllTagTypes((tagType, shadowedBlock) => it(`when using ${toString(tagType)} tags`, async () => (await shadowedBlock())), block));
}
