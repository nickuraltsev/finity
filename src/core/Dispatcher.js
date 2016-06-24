export default class Dispatcher {
  isBusy = false;
  eventQueue = [];

  constructor(processor) {
    this.processor = processor;
  }

  dispatch(event, eventPayload) {
    if (!this.isBusy) {
      this.execute(() => this.processor(event, eventPayload));
    } else {
      this.eventQueue.push({ event, eventPayload });
    }
    return this;
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
        this.processor(event, eventPayload);
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
