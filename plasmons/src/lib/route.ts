export type Route = { view: "explore" } | { view: "create" };

/** Maps `location.hash` to a view. Anything unrecognised falls back to the default view. */
export function parseRoute(hash: string): Route {
  const [path] = hash.replace(/^#\/?/, "").split("/");
  switch (path) {
    case "create":
      return { view: "create" };
    default:
      return { view: "explore" };
  }
}
