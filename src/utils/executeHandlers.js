export default function executeHandlers(handlers, ...args) {
  handlers.forEach(handler => handler(...args));
}
