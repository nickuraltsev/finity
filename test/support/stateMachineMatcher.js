export default function stateMachineMatcher() {
  return {
    asymmetricMatch(value) {
      return value && typeof value.getCurrentState === 'function';
    }
  };
}
