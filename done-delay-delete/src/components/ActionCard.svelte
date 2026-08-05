<script lang="ts">
  import type { Action } from "../domain/projection";

  let {
    action,
    onDone,
    onDelay,
    onDelete,
  }: {
    action: Action;
    onDone: (id: string) => void;
    onDelay: (id: string) => void;
    onDelete: (id: string) => void;
  } = $props();
</script>

<li class="action" data-status={action.status} data-action-id={action.id}>
  <p class="text">{action.text}</p>
  <div class="controls">
    <button class="done" onclick={() => onDone(action.id)}>done</button>
    <button class="delay" onclick={() => onDelay(action.id)}>delay</button>
    <button class="delete" onclick={() => onDelete(action.id)}>delete</button>
  </div>
</li>

<style>
  .action {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    padding: var(--space-s) var(--space-m);
    border-radius: 2px;
    background: #ffffff;
    border: 1px solid #ececec;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  .action[data-status="done"],
  .action[data-status="deleted"] {
    opacity: 0.5;
  }

  .text {
    flex: 1;
    margin: 0;
    font-size: var(--step-0);
  }

  .controls {
    display: flex;
    gap: var(--space-2xs);
  }

  .controls button {
    padding: var(--space-2xs) var(--space-xs);
    border: 1px solid transparent;
    cursor: pointer;
    font-weight: 600;
    transition: transform 0.05s ease;
  }

  .controls button:active {
    transform: scale(0.96);
  }

  .controls .done {
    background: crimson;
    color: #fff;
  }

  .controls .delay {
    background: #1a1a1a;
    color: #fff;
  }

  .controls .delete {
    background: transparent;
    border-color: #d6d6d6;
    color: #1a1a1a;
  }

  .status {
    font-size: var(--step--2);
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  @media (max-width: 36rem) {
    .action {
      flex-wrap: wrap;
    }
    .status {
      display: none;
    }
  }
</style>

