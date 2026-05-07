export interface CountdownState {
  index: number;
  duration: number;
  remaining: number;
}

export class CountdownService {
  private audioCtx: AudioContext | null = null;
  private interval: number | null = null;
  private state: CountdownState | null = null;

  constructor(
    private createAudioCtx: () => AudioContext = () => new AudioContext(),
    private onTick: (state: CountdownState | null) => void = () => {},
  ) {}

  getState() {
    return this.state;
  }

  initAudio(hasTimer: boolean) {
    if (hasTimer && !this.audioCtx) {
      this.audioCtx = this.createAudioCtx();
    }
  }

  start(index: number, duration: number) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.state = { index, duration, remaining: duration };
    this.onTick(this.state);

    this.interval = setInterval(() => {
      if (!this.state || this.state.remaining <= 0) return;

      const newRemaining = this.state.remaining - 1;
      this.state = { ...this.state, remaining: newRemaining };
      this.onTick(this.state);

      if (newRemaining === 2 || newRemaining === 1) {
        this.playBeep(100);
      } else if (newRemaining === 0) {
        this.playBeep(400);
      }

      if (newRemaining === 0) {
        clearInterval(this.interval!);
        this.interval = null;
      }
    }, 1000) as unknown as number;
  }

  clear() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.state = null;
    this.onTick(null);
  }

  private playBeep(duration: number) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioCtx.currentTime + duration / 1000,
    );
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration / 1000);
  }
}
