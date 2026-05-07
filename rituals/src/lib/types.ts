export interface Ritual {
  id: string;
  name: string;
  markdown: string;
}

export interface RitualLine {
  type: "checkbox" | "pre";
  content: string;
  duration: number | null;
  index: number;
}
