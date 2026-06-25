.PHONY: dev
dev: node_modules
	@npx tsx server/index.ts & \
	SERVER_PID=$$!; \
	trap "kill $$SERVER_PID 2>/dev/null" EXIT INT TERM; \
	npx vite --port 8080

.PHONY: dev-server
dev-server: node_modules
	npx tsx server/index.ts

.PHONY: build
build: node_modules
	npx vite build

.PHONY: prod
prod: node_modules
	npx vite preview --port 8080

.PHONY: check
check: node_modules
	npx svelte-check --tsconfig ./tsconfig.app.json && npx tsc -p tsconfig.node.json && npx vitest run


.PHONY: release
release: build
	mc mirror --overwrite --remove ./dist rknt/tools/worktimer

node_modules: package.json pnpm-lock.yaml
	pnpm install --frozen-lockfile

