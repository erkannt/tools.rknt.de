import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CountdownService } from "./countdown";

function createMockAudioContext() {
  const oscillator = {
    connect: vi.fn(),
    frequency: { value: 0 },
    type: "",
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gainNode = {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  };
  return {
    state: "running" as AudioContextState,
    currentTime: 0,
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gainNode),
    destination: {},
    resume: vi.fn(),
  };
}

describe("CountdownService", () => {
  let mockAudioCtx: ReturnType<typeof createMockAudioContext>;
  let createAudioCtx: () => AudioContext;
  let tickStates: (ReturnType<CountdownService["getState"]>)[];

  beforeEach(() => {
    vi.useFakeTimers();
    mockAudioCtx = createMockAudioContext();
    createAudioCtx = vi.fn(() => mockAudioCtx as unknown as AudioContext);
    tickStates = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function makeService() {
    return new CountdownService(createAudioCtx, (s) => tickStates.push(s));
  }

  it("creates AudioContext on initAudio when hasTimer is true", () => {
    const svc = makeService();
    svc.initAudio(true);
    expect(createAudioCtx).toHaveBeenCalledOnce();
  });

  it("does not create AudioContext when hasTimer is false", () => {
    const svc = makeService();
    svc.initAudio(false);
    expect(createAudioCtx).not.toHaveBeenCalled();
  });

  it("does not recreate AudioContext if already initialized", () => {
    const svc = makeService();
    svc.initAudio(true);
    svc.initAudio(true);
    expect(createAudioCtx).toHaveBeenCalledOnce();
  });

  it("starts countdown with correct initial state", () => {
    const svc = makeService();
    svc.start(2, 5);
    expect(svc.getState()).toEqual({ index: 2, duration: 5, remaining: 5 });
    expect(tickStates).toEqual([{ index: 2, duration: 5, remaining: 5 }]);
  });

  it("decrements remaining on each tick", () => {
    const svc = makeService();
    svc.start(0, 3);

    vi.advanceTimersByTime(1000);
    expect(svc.getState()?.remaining).toBe(2);

    vi.advanceTimersByTime(1000);
    expect(svc.getState()?.remaining).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(svc.getState()?.remaining).toBe(0);
  });

  it("fires onTick callback on each tick", () => {
    const svc = makeService();
    svc.start(0, 3);
    expect(tickStates).toHaveLength(1); // initial

    vi.advanceTimersByTime(1000);
    expect(tickStates).toHaveLength(2);
    expect(tickStates.at(-1)?.remaining).toBe(2);

    vi.advanceTimersByTime(1000);
    expect(tickStates).toHaveLength(3);
    expect(tickStates.at(-1)?.remaining).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(tickStates).toHaveLength(4);
    expect(tickStates.at(-1)?.remaining).toBe(0);
  });

  it("plays short beep at remaining 2 and 1", () => {
    const svc = makeService();
    svc.initAudio(true);
    svc.start(0, 3);

    vi.advanceTimersByTime(1000); // remaining=2
    expect(mockAudioCtx.createOscillator).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000); // remaining=1
    expect(mockAudioCtx.createOscillator).toHaveBeenCalledTimes(2);
  });

  it("plays long beep when countdown reaches 0", () => {
    const svc = makeService();
    svc.initAudio(true);
    svc.start(0, 2);

    vi.advanceTimersByTime(1000); // remaining=1, short beep
    expect(mockAudioCtx.createOscillator).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000); // remaining=0, long beep
    expect(mockAudioCtx.createOscillator).toHaveBeenCalledTimes(2);
  });

  it("does not play beep if audioCtx was never initialized", () => {
    const svc = makeService();
    svc.start(0, 2);

    vi.advanceTimersByTime(2000);
    expect(mockAudioCtx.createOscillator).not.toHaveBeenCalled();
  });

  it("resumes suspended AudioContext before playing beep", () => {
    mockAudioCtx.state = "suspended";
    const svc = makeService();
    svc.initAudio(true);
    svc.start(0, 1);

    vi.advanceTimersByTime(1000);
    expect(mockAudioCtx.resume).toHaveBeenCalledOnce();
  });

  it("clears interval and resets state", () => {
    const svc = makeService();
    svc.start(0, 5);
    expect(svc.getState()).not.toBeNull();

    svc.clear();
    expect(svc.getState()).toBeNull();
    expect(tickStates.at(-1)).toBeNull();
  });

  it("clears previous interval when starting new countdown", () => {
    const svc = makeService();
    svc.start(0, 5);
    expect(svc.getState()?.index).toBe(0);

    svc.start(1, 3);
    expect(svc.getState()).toEqual({ index: 1, duration: 3, remaining: 3 });
  });

  it("stops ticking after countdown reaches 0", () => {
    const svc = makeService();
    svc.start(0, 2);

    vi.advanceTimersByTime(2000); // reach 0
    expect(svc.getState()?.remaining).toBe(0);

    vi.advanceTimersByTime(1000); // extra tick should not change state
    expect(svc.getState()?.remaining).toBe(0);
    expect(tickStates.at(-1)?.remaining).toBe(0);
  });
});
