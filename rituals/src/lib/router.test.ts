import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseUrl, pushState, createRouter } from "./router";

describe("parseUrl", () => {
  it("parses home view by default", () => {
    expect(parseUrl("")).toEqual({ view: "home", id: null, data: null });
    expect(parseUrl("?")).toEqual({ view: "home", id: null, data: null });
  });

  it("parses add view", () => {
    expect(parseUrl("?view=add")).toEqual({ view: "add", id: null, data: null });
  });

  it("parses share view", () => {
    expect(parseUrl("?view=share")).toEqual({ view: "share", id: null, data: null });
  });

  it("parses view with id", () => {
    expect(parseUrl("?view=view&id=abc-123")).toEqual({ view: "view", id: "abc-123", data: null });
  });

  it("parses edit with id", () => {
    expect(parseUrl("?view=edit&id=xyz-789")).toEqual({ view: "edit", id: "xyz-789", data: null });
  });

  it("parses import with data", () => {
    expect(parseUrl("?view=import&data=someencodeddata")).toEqual({
      view: "import",
      id: null,
      data: "someencodeddata",
    });
  });

  it("falls back to home for import without data", () => {
    expect(parseUrl("?view=import")).toEqual({ view: "home", id: null, data: null });
  });

  it("falls back to home for view without id", () => {
    expect(parseUrl("?view=view")).toEqual({ view: "home", id: null, data: null });
  });

  it("falls back to home for edit without id", () => {
    expect(parseUrl("?view=edit")).toEqual({ view: "home", id: null, data: null });
  });
});

describe("pushState", () => {
  let pushSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    pushSpy = vi.spyOn(window.history, "pushState").mockImplementation(() => {});
  });

  afterEach(() => {
    pushSpy.mockRestore();
  });

  it("pushes path with base path", () => {
    pushState("/?view=add", "/rituals");
    expect(pushSpy).toHaveBeenCalledWith({}, "", "/rituals/?view=add");
  });

  it("uses default base path", () => {
    pushState("/?view=share");
    expect(pushSpy).toHaveBeenCalledWith({}, "", "/rituals/?view=share");
  });
});

describe("createRouter", () => {
  let addEventSpy: ReturnType<typeof vi.spyOn>;
  let removeEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventSpy = vi.spyOn(window, "addEventListener");
    removeEventSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    addEventSpy.mockRestore();
    removeEventSpy.mockRestore();
  });

  it("registers popstate listener", () => {
    const handler = vi.fn();
    createRouter(handler);
    expect(addEventSpy).toHaveBeenCalledWith("popstate", handler);
  });

  it("push calls history.pushState", () => {
    const pushSpy = vi.spyOn(window.history, "pushState").mockImplementation(() => {});
    const handler = vi.fn();
    const router = createRouter(handler);
    router.push("/?view=add");
    expect(pushSpy).toHaveBeenCalledWith({}, "", "/rituals/?view=add");
    pushSpy.mockRestore();
  });

  it("sync calls the handler", () => {
    const handler = vi.fn();
    const router = createRouter(handler);
    router.sync();
    expect(handler).toHaveBeenCalledOnce();
  });
});
