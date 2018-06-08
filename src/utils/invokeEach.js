export default async function invokeEach(fns, ...args) {
  return await Promise.all(fns.map(async fn => (await fn(...args))));
}
