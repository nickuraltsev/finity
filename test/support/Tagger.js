const tagFactories = {
  string(key) { return key.toString(); },
  Symbol(key) { return Symbol(key.toString()); },
  Object(key) { return { toString() { return `Object(${key.toString()})`; } }; },
  Number() { return this.tagMap.size + 1; },
  RandomNumber() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const rand = Math.floor(Math.random() * 10000);
      if (!Array.from(this.tagMap.values()).includes(rand)) return rand;
    }
  },
  Map(key) {
    return new Map([['tag', key]]);
  },
  Function(key) {
    return () => key;
  },
};

function bindTagFactory(typeNameOrFactoryFunction, toTagger = undefined) {
  if (typeNameOrFactoryFunction instanceof Function) {
    return typeNameOrFactoryFunction.bind(toTagger);
  }
  if (!tagFactories[typeNameOrFactoryFunction]) throw new Error('Unknown tag type!');
  return tagFactories[typeNameOrFactoryFunction].bind(toTagger);
}

export default class Tagger {
  constructor(typeNameOrFactoryFunction = x => x) {
    this.tagFactory = bindTagFactory(typeNameOrFactoryFunction, this);
    this.tagMap = new Map();
  }

  tagFor(key) {
    if (!this.tagMap.has(key)) this.tagMap.set(key, this.tagFactory.bind(this)(key));
    return this.tagMap.get(key);
  }

  static get BuiltinTagTypes() {
    return Object.keys(tagFactories);
  }
}
