import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WakeLockService } from "./wakeLock";

interface MockSentinel {
  released: boolean;
  release: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  _fireRelease: () => void;
}

function createSentinel(): MockSentinel {
  const listeners: Record<string, (() => void)[]> = {};
  const sentinel: MockSentinel = {
    released: false,
    release: vi.fn(() => {
      sentinel.released = true;
      for (const cb of listeners["release"] ?? []) cb();
      return Promise.resolve();
    }),
    addEventListener: vi.fn((type: string, cb: () => void) => {
      (listeners[type] ??= []).push(cb);
    }),
    _fireRelease: () => {
      for (const cb of listeners["release"] ?? []) cb();
    },
  };
  return sentinel;
}

function stubWakeLock(request: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "wakeLock", {
    configurable: true,
    value: { request },
  });
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
}

describe("WakeLockService", () => {
  let request: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setVisibility("visible");
    request = vi.fn();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (navigator as unknown as Record<string, unknown>).wakeLock;
  });

  it("does nothing when the Wake Lock API is unsupported", () => {
    const svc = new WakeLockService();
    expect(() => svc.acquire()).not.toThrow();
    expect(request).not.toHaveBeenCalled();
    svc.release();
  });

  it("requests a screen wake lock on acquire when visible", async () => {
    const sentinel = createSentinel();
    request.mockResolvedValue(sentinel);
    stubWakeLock(request);

    const svc = new WakeLockService();
    svc.acquire();
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith("screen"));
    svc.release();
  });

  it("does not request while the tab is hidden, then acquires on visibilitychange", async () => {
    const sentinel = createSentinel();
    request.mockResolvedValue(sentinel);
    stubWakeLock(request);

    setVisibility("hidden");
    const svc = new WakeLockService();
    svc.acquire();
    expect(request).not.toHaveBeenCalled();

    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith("screen"));
    svc.release();
  });

  it("releases the sentinel and removes the listener on release", async () => {
    const sentinel = createSentinel();
    request.mockResolvedValue(sentinel);
    stubWakeLock(request);

    const svc = new WakeLockService();
    svc.acquire();
    await vi.waitFor(() => expect(request).toHaveBeenCalled());

    svc.release();
    expect(sentinel.release).toHaveBeenCalledOnce();
    expect(sentinel.released).toBe(true);

    setVisibility("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(request).toHaveBeenCalledOnce();
  });

  it("clears the sentinel when the browser auto-releases the lock", async () => {
    const sentinel = createSentinel();
    request.mockResolvedValue(sentinel);
    stubWakeLock(request);

    const svc = new WakeLockService();
    svc.acquire();
    await vi.waitFor(() => expect(request).toHaveBeenCalled());

    sentinel._fireRelease();

    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    svc.release();
  });

  it("does not request again while a sentinel is already held", async () => {
    const sentinel = createSentinel();
    request.mockResolvedValue(sentinel);
    stubWakeLock(request);

    const svc = new WakeLockService();
    svc.acquire();
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());

    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(request).toHaveBeenCalledOnce();
    svc.release();
  });

  it("logs a warning and continues when the request is rejected", async () => {
    const err = new DOMException("not allowed", "NotAllowedError");
    request.mockRejectedValue(err);
    stubWakeLock(request);

    const svc = new WakeLockService();
    svc.acquire();
    await vi.waitFor(() => expect(request).toHaveBeenCalled());
    expect(console.warn).toHaveBeenCalledWith("Wake lock request failed:", err);
    svc.release();
  });
});
