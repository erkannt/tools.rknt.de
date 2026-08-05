import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mount, unmount } from "svelte";
import { tick } from "svelte";
import App from "./App.svelte";
import type { ActionEvent } from "./domain/events";
import { STORAGE_KEY } from "./domain/persistence";

const NOW = 1_000_000;

function seed(events: ActionEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function created(id: string, text: string, createdAt: number): ActionEvent {
  return { type: "actionCreated", id, text, createdAt };
}
function done(id: string): ActionEvent {
  return { type: "actionDone", id, doneAt: NOW };
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    unmountAll();
  });

  it("shows an empty state when there are no actions", async () => {
    mountApp();
    await tick();
    expect(document.querySelector(".empty")).not.toBeNull();
    expect(document.querySelectorAll(".action")).toHaveLength(0);
  });

  it("renders up to three landing actions in queue order", async () => {
    seed([
      created("a", "first", 100),
      created("b", "second", 200),
      created("c", "third", 300),
      created("d", "fourth", 400),
    ]);
    mountApp();
    await tick();
    const texts = [...document.querySelectorAll(".action .text")].map((el) =>
      el.textContent?.trim(),
    );
    expect(texts).toEqual(["first", "second", "third"]);
  });

  it("creates an action via the form and persists it", async () => {
    mountApp();
    await tick();
    const textarea = document.querySelector<HTMLTextAreaElement>(
      ".create textarea",
    )!;
    textarea.value = "buy milk";
    textarea.dispatchEvent(new Event("input"));
    await tick();

    const form = document.querySelector<HTMLFormElement>(".create")!;
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();

    const texts = [...document.querySelectorAll(".action .text")].map((el) =>
      el.textContent?.trim(),
    );
    expect(texts).toContain("buy milk");
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("marking an action done removes it from the landing and pulls in the next", async () => {
    seed([
      created("a", "first", 100),
      created("b", "second", 200),
      created("c", "third", 300),
      created("d", "fourth", 400),
    ]);
    mountApp();
    await tick();

    clickButtonFor("first", "done");
    await tick();

    const texts = [...document.querySelectorAll(".action .text")].map((el) =>
      el.textContent?.trim(),
    );
    expect(texts).toEqual(["second", "third", "fourth"]);
  });

  it("delaying an action removes it from the landing", async () => {
    seed([
      created("a", "first", 100),
      created("b", "second", 200),
      created("c", "third", 300),
      created("d", "fourth", 400),
    ]);
    mountApp();
    await tick();

    clickButtonFor("first", "delay");
    await tick();

    const texts = [...document.querySelectorAll(".action .text")].map((el) =>
      el.textContent?.trim(),
    );
    expect(texts).toEqual(["second", "third", "fourth"]);
  });

  it("deleting an action removes it from the landing", async () => {
    seed([
      created("a", "first", 100),
      created("b", "second", 200),
      created("c", "third", 300),
    ]);
    mountApp();
    await tick();

    clickButtonFor("first", "delete");
    await tick();

    const texts = [...document.querySelectorAll(".action .text")].map((el) =>
      el.textContent?.trim(),
    );
    expect(texts).toEqual(["second", "third"]);
  });

  it("restores persisted events on mount", async () => {
    seed([created("a", "restored", 100)]);
    mountApp();
    await tick();
    const texts = [...document.querySelectorAll(".action .text")].map((el) =>
      el.textContent?.trim(),
    );
    expect(texts).toEqual(["restored"]);
  });
});

let mounted: ReturnType<typeof mount>[] = [];

function mountApp() {
  mounted.push(mount(App, { target: document.body }));
}

function unmountAll() {
  for (const instance of mounted) unmount(instance);
  mounted = [];
  document.body.innerHTML = "";
}

function clickButtonFor(text: string, buttonClass: string) {
  const items = [...document.querySelectorAll(".action")];
  const item = items.find((el) =>
    el.querySelector(".text")?.textContent?.trim() === text,
  )!;
  item.querySelector<HTMLButtonElement>(`button.${buttonClass}`)!.click();
}
