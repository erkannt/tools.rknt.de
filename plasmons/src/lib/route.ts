export type Route = { view: "explore" };

/** Maps `location.hash` to a view. Anything unrecognised falls back to the default view. */
export function parseRoute(hash: string): Route {
  const [path] = hash.replace(/^#\/?/, "").split("/");
  switch (path) {
    default:
      return { view: "explore" };
  }
}
