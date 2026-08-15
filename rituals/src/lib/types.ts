export interface Ritual {
  id: string;
  name: string;
  markdown: string;
}

export interface TimerSpec {
  repeats: number;
  duration: number;
}

export interface RitualLine {
  type: "checkbox" | "pre";
  content: string;
  duration: TimerSpec | null;
  index: number;
}
