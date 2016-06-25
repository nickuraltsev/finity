export default class Dispatcher {
  isBusy = false;
  eventQueue = [];

  constructor(handler) {
    this.handler = handler;
  }

  dispatch(event, eventPayload) {
    if (!this.isBusy) {
      this.execute(() => this.handler(event, eventPayload));
    } else {
      this.eventQueue.push({ event, eventPayload });
    }
  }

  execute(operation) {
    if (this.isBusy) {
      throw new Error('Operation cannot be executed because another operation is in progress.');
    }
    this.isBusy = true;
    try {
      operation();

      // Process all events
      while (this.eventQueue.length > 0) {
        const { event, eventPayload } = this.eventQueue.shift();
        this.handler(event, eventPayload);
      }
    } finally {
      // Clean up
      if (this.eventQueue.length > 0) {
        this.eventQueue = [];
      }
      this.isBusy = false;
    }
  }
}
