import mapValues from './mapValues';

export default function deepCopy(value) {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(deepCopy);
  }
  if (typeof value === 'object') {
    return mapValues(value, deepCopy);
  }
  return value;
}
