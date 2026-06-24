.PHONY: dev
dev: node_modules
	npx vite --port 8080

.PHONY: build
build: node_modules
	npx vite build

.PHONY: prod
prod: node_modules
	npx vite preview --port 8080

.PHONY: check
check: node_modules
	npx svelte-check --tsconfig ./tsconfig.app.json && npx tsc -p tsconfig.node.json && npx vitest run

node_modules: package.json pnpm-lock.yaml
	pnpm install --frozen-lockfile

