import { decodeSimulation } from "./link";
import type { Simulation } from "./simulate";

export type Route = { view: "explore" } | { view: "create" } | { view: "fit"; simulation: Simulation };

/** Maps `location.hash` to a view. Anything unrecognised or invalid falls back to the default view. */
export function parseRoute(hash: string): Route {
  const [path, data] = hash.replace(/^#\/?/, "").split("/");
  switch (path) {
    case "create":
      return { view: "create" };
    case "fit": {
      const simulation = data ? decodeSimulation(data) : null;
      return simulation ? { view: "fit", simulation } : { view: "explore" };
    }
    default:
      return { view: "explore" };
  }
}
