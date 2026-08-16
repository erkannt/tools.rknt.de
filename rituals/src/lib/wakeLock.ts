export class WakeLockService {
  private sentinel: WakeLockSentinel | null = null;

  acquire() {
    if (!("wakeLock" in navigator)) return;
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.request();
  }

  release() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.releaseSentinel();
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      this.request();
    }
  };

  private async request() {
    if (this.sentinel) return;
    if (document.visibilityState !== "visible") return;
    try {
      this.sentinel = await navigator.wakeLock.request("screen");
      this.sentinel.addEventListener("release", () => {
        this.sentinel = null;
      });
    } catch (err) {
      console.warn("Wake lock request failed:", err);
    }
  }

  private releaseSentinel() {
    if (this.sentinel) {
      this.sentinel.release().catch(() => {});
      this.sentinel = null;
    }
  }
}
