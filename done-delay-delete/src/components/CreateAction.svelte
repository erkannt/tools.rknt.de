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
  <textarea
    bind:value={text}
    placeholder="What do you need to do?"
    aria-label="New action text"
    rows="2"
  ></textarea>
  <button class="submit" type="submit" disabled={!text.trim()}>create action</button>
</form>

<style>
  .create {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    padding: var(--space-s) var(--space-m);
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid #ececec;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  textarea {
    resize: vertical;
    font: inherit;
    padding: var(--space-2xs) var(--space-xs);
    border-radius: 12px;
    border: 1px solid #d6d6d6;
    background: #fbfbfb;
    color: inherit;
  }

  textarea:focus {
    outline: 2px solid crimson;
    outline-offset: 1px;
    border-color: transparent;
    background: #fff;
  }

  .submit {
    align-self: flex-end;
    padding: var(--space-2xs) var(--space-m);
    border-radius: 999px;
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