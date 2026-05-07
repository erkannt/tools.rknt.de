import { LocalStorage } from "../lib/localStorage.svelte";
import type { Ritual } from "../lib/types";

export function createRitualStore() {
  const rituals = new LocalStorage<Ritual[]>("rituals", []);

  function add(name: string, markdown: string) {
    rituals.current.push({ id: crypto.randomUUID(), name, markdown });
  }

  function update(id: string, name: string, markdown: string) {
    const updated = rituals.current.map((r: Ritual) =>
      r.id === id ? { ...r, name, markdown } : r,
    );
    rituals.current.length = 0;
    rituals.current.push(...updated);
  }

  function remove(id: string) {
    const index = rituals.current.findIndex((r: Ritual) => r.id === id);
    if (index !== -1) rituals.current.splice(index, 1);
  }

  function findById(id: string): Ritual | null {
    return rituals.current.find((r: Ritual) => r.id === id) || null;
  }

  function getExistingName(id: string): string | null {
    const existing = findById(id);
    return existing ? existing.name : null;
  }

  function importRitual(ritual: Ritual) {
    const index = rituals.current.findIndex((r: Ritual) => r.id === ritual.id);
    if (index !== -1) {
      rituals.current[index] = ritual;
    } else {
      rituals.current.push(ritual);
    }
  }

  return {
    get current() {
      return rituals.current;
    },
    add,
    update,
    remove,
    findById,
    getExistingName,
    importRitual,
  };
}
