<script lang="ts">
  import { appendEvent } from './events'

  function start() {
    appendEvent({ type: 'WorkStarted', at: Date.now() })
  }
</script>

<h1>worktimer</h1>

<button onclick={start}>Start</button>
