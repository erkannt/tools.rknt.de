<script lang="ts">
  let { onCreate }: { onCreate: (text: string) => void } = $props();

  let text = $state("");
  let submitted = false;

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    onCreate(value);
    text = "";
    submitted = true;
  }
</script>

<form class="create" onsubmit={submit}>
  <input type="text" bind:value={text} aria-label="New action text" />
  <button class="submit" type="submit" disabled={!text.trim()}
    >create action</button
  >
</form>

<style>
  .create {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    padding: var(--space-s) var(--space-m);
    border-radius: 2px;
    background: #ffffff;
    border: 1px solid #ececec;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  input {
    font: inherit;
    padding: var(--space-2xs) var(--space-xs);
    border-radius: 2px;
    border: 1px solid #d6d6d6;
    background: #fbfbfb;
    color: inherit;
  }

  input:focus {
    outline: 2px solid crimson;
    outline-offset: 1px;
    border-color: transparent;
    background: #fff;
  }

  .submit {
    width: 100%;
    padding: var(--space-2xs) var(--space-m);
    border: none;
    background: crimson;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }

  .submit:disabled {
    background: #d6d6d6;
    color: #888;
    cursor: not-allowed;
  }
</style>

