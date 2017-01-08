export default class TaskScheduler {
  queue = [];
  isBusy = false;

  enqueue(task) {
    if (this.isBusy) {
      this.queue.push(task);
    } else {
      this.execute(task);
    }
  }

  execute(task) {
    if (this.isBusy) {
      throw new Error('Cannot execute task because another task is already running.');
    }
    this.isBusy = true;
    try {
      task();
      while (this.queue.length > 0) {
        const nextTask = this.queue.shift();
        nextTask();
      }
    } finally {
      // Clean up
      if (this.queue.length > 0) {
        this.queue = [];
      }
      this.isBusy = false;
    }
  }
}
