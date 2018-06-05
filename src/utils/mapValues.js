export default function mapValues(obj, callback, excludeKeys = []) {
  if (obj instanceof Map) {
    return new Map(
      Array.from(obj.entries())
      .map(([k, v]) => ([k, (excludeKeys.includes(k) ? v : callback(v))]))
    );
  }
  const prototype = Object.getPrototypeOf(obj);
  const result = Object.create(prototype);
  return Object.entries(obj)
    .map(([k, v]) => ([k, (excludeKeys.includes(k) ? v : callback(v))]))
    .reduce((acc, [k, v]) => Object.assign(acc, { [k]: v }), result);
}
