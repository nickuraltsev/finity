export default function merge(target, source) {
  Object.keys(source).forEach(key => {
    target[key] = source[key];
  });
  return target;
}
