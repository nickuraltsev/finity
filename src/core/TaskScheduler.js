export default class TaskScheduler {
  constructor() {
    this.queue = [];
    this.runningPromise = null;
  }

  async enqueue(task) {
    const retvalPromise = new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await task());
        } catch (e) {
          reject(e);
        }
      });
    });
    if (!this.runningPromise) await this.runAll();
    return await retvalPromise;
  }

  async runAll() {
    if (this.runningPromise) {
      await this.runningPromise;
      return;
    }

    let finished;
    this.runningPromise = new Promise(resolve => { finished = resolve; });
    try {
      while (this.queue.length > 0) {
        const nextTask = this.queue.shift();
        // eslint-disable-next-line no-await-in-loop
        await nextTask();
      }
    } finally {
      // Clean up
      if (this.queue.length > 0) {
        this.queue = [];
      }
      finished();
      this.runningPromise = null;
    }
  }
}
