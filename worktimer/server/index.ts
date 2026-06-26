// CLI entry point for the worktimer sync server. Configuration via env:
//   ALLOWED_ORIGINS   required, comma-separated list of permitted origins
//   PORT              default 1234
//   HOST              default 0.0.0.0
//   MAX_ROOMS         default 100
//   MAX_MESSAGE_BYTES default 1000000
//   MAX_DOC_BYTES     default 5000000

import { createServer } from './server.ts'

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

if (allowedOrigins.length === 0) {
  console.error(
    'ALLOWED_ORIGINS is required (comma-separated list of permitted origins, ' +
      'e.g. "https://tools.rknt.de"). Refusing to start.',
  )
  process.exit(1)
}

const port = Number(process.env.PORT ?? 1234)
const host = process.env.HOST ?? '0.0.0.0'
const maxRooms = Number(process.env.MAX_ROOMS ?? 100)
const maxMessageBytes = Number(process.env.MAX_MESSAGE_BYTES ?? 1_000_000)
const maxDocBytes = Number(process.env.MAX_DOC_BYTES ?? 5_000_000)

createServer({ allowedOrigins, port, host, maxRooms, maxMessageBytes, maxDocBytes }).then(
  server => {
    console.log(`worktimer sync server listening on ${server.url}`)
    console.log(
      `limits: origins=[${allowedOrigins.join(', ')}] maxRooms=${maxRooms} ` +
        `maxMessageBytes=${maxMessageBytes} maxDocBytes=${maxDocBytes}`,
    )

    const shutdown = () => {
      server.close().then(() => process.exit(0))
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  },
)
