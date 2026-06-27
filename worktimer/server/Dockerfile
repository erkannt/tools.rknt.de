# Worktimer sync server — in-memory Yjs websocket relay.
# Build context is this server/ directory.
FROM node:24-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Install dependencies first for better layer caching. tsx (a devDependency)
# is the runtime used to execute the TypeScript entry point.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY *.ts ./

ENV PORT=1234
ENV HOST=0.0.0.0
EXPOSE 1234

CMD ["pnpm", "start"]
