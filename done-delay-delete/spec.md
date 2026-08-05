# done delay delete

A todo list with a kind landing.

## Behaviour

- show three actions you could take
- for each action you can mark it as done, delay it or delete it
- done, delay, delete all remove the action from the landing page, making space for another action from the queue
- delaying an action makes it return in the future, the older the action is the further back it gets place in the queue

## Architecture

- event sourced
- PWA
- state persisted to local browser storage
