# Worktimer sync server — in-memory Yjs websocket relay.
# Build context is this server/ directory.
FROM node:24-alpine

WORKDIR /app

# Install dependencies first for better layer caching. tsx (a devDependency)
# is the runtime used to execute the TypeScript entry point.
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY *.ts ./

ENV PORT=1234
ENV HOST=0.0.0.0
EXPOSE 1234

CMD ["npx", "tsx", "index.ts"]
