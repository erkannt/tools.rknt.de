// CLI entry point for the worktimer sync server.
// PORT (default 1234) and HOST (default 0.0.0.0) come from the environment.

import { createServer } from './server.ts'

const port = Number(process.env.PORT ?? 1234)
const host = process.env.HOST ?? '0.0.0.0'

createServer({ port, host }).then(server => {
  console.log(`worktimer sync server listening on ${server.url}`)

  const shutdown = () => {
    server.close().then(() => process.exit(0))
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
})
