export default class AsyncActionSubscription {
  constructor(successListener, failureListener) {
    this.successListener = successListener;
    this.failureListener = failureListener;
    this.onSuccess = ::this.onSuccess;
    this.onFailure = ::this.onFailure;
  }

  onSuccess(result) {
    if (this.successListener) {
      this.successListener(result);
    }
  }

  onFailure(error) {
    if (this.failureListener) {
      this.failureListener(error);
    }
  }

  cancel() {
    this.successListener = null;
    this.failureListener = null;
  }
}
