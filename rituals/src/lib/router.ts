export type View =
  | "home"
  | "add"
  | "view"
  | "edit"
  | "share"
  | "import"
  | "share-success";

export interface RouteState {
  view: View;
  id: string | null;
  data: string | null;
}

export function parseUrl(search: string): RouteState {
  const params = new URLSearchParams(search);
  const viewParam = params.get("view");
  const id = params.get("id");
  const data = params.get("data");

  if (viewParam === "add") return { view: "add", id: null, data: null };
  if (viewParam === "share") return { view: "share", id: null, data: null };
  if (viewParam === "import" && data) return { view: "import", id: null, data };
  if (viewParam === "view" && id) return { view: "view", id, data: null };
  if (viewParam === "edit" && id) return { view: "edit", id, data: null };
  return { view: "home", id: null, data: null };
}

export function pushState(path: string, basePath: string = "/rituals") {
  if (typeof window !== "undefined") {
    window.history.pushState({}, "", basePath + path);
  }
}

export function createRouter(
  onRouteChange: () => void,
): { sync: () => void; push: (path: string) => void } {
  if (typeof window !== "undefined") {
    window.addEventListener("popstate", onRouteChange);
  }

  return {
    sync: onRouteChange,
    push(path: string) {
      pushState(path);
    },
  };
}
