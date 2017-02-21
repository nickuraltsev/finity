export default function invokeEach(fns, ...args) {
  fns.forEach(fn => fn(...args));
}
