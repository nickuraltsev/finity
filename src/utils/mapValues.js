export default function mapValues(obj, callback) {
  const prototype = Object.getPrototypeOf(obj);
  const result = Object.create(prototype);
  Object.keys(obj).forEach(key => {
    result[key] = callback(obj[key]);
  });
  return result;
}
