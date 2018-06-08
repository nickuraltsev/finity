export default function toString(x) {
  try {
    return x.toString();
  } catch (e) { } // eslint-disable-line no-empty
  return Object.prototype.toString.call(x);
}
