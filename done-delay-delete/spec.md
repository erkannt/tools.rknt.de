# done delay delete

A todo list with a kind landing.

## Behaviour

- show three actions you could take
- for each action you can mark it as done, delay it or delete it
- done, delay, delete all remove the action from the landing page, making space for another action from the queue
- delaying an action makes it return in the future, the older the action is the further back it gets place in the queue

### Queue behaviour

- order queue by `showAt`
- `showAt` = `createAt` if action has never been delayed
- delay command raises event with new `showAt` = `now() + delay`
- delay is `fibonacci(numberOfDelays + 1) x 6h`

## Architecture

- event sourced
- PWA
- state persisted to local browser storage
- styling lives with components

## Development process

- red-green-refactor
- TDD
- complete functionality first, then style
- prefix commits with "AGENT ddd:"

This repo lives on virtio fs with limited file handles (see ulimit -n). /tmp and /home/agent do not have this restriction. I you need to run pnpm install or other operations that require lots of open files, find ways to run them in these directories instead. Workarounds you can consider:

- git worktree and later fast-forward merge completed work
- edit .npmrc temporarily
  store-dir = /tmp/pnpm-store
  virtual-store-dir = /tmp/pnpm-virtual-store
