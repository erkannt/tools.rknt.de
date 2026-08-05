<script lang="ts">
  let { onFirstAction }: { onFirstAction: () => void } = $props();
</script>

<section class="empty">
  <h2>Nothing to do right now</h2>
  <p>
    Your queue is empty. Create your first action and it will land right here.
  </p>
  <button class="prompt" onclick={onFirstAction}>create an action</button>
</section>

<style>
  .empty {
    text-align: center;
    padding: var(--space-2xl) var(--space-l);
    border-radius: 16px;
    border: 2px dashed #d0d0d0;
    color: #555;
  }

  .empty h2 {
    margin: 0 0 var(--space-2xs);
  }

  .empty p {
    max-width: 30rem;
    margin: 0 auto var(--space-s);
  }

  .prompt {
    padding: var(--space-2xs) var(--space-m);
    border-radius: 999px;
    border: 1px solid crimson;
    background: transparent;
    color: crimson;
    font-weight: 600;
    cursor: pointer;
  }

  .prompt:hover {
    background: crimson;
    color: #fff;
  }
</style>