.PHONY: dev
dev: node_modules
	pnpm run dev --port 8080

.PHONY: build
build: node_modules
	pnpm run build

.PHONY: prod-preview
prod-preview: node_modules
	pnpm run preview --port 8080

.PHONY: release
release: build
	mc mirror --overwrite --remove ./dist rknt/tools/goldcards

.PHONY: check
check: node_modules test
	npx svelte-check --tsconfig ./tsconfig.json
	npx prettier --check .
	npx eslint .

.PHONY: test
test: node_modules
	npx vitest run

node_modules: pnpm-lock.yaml package.json
	pnpm install --frozen-lockfile
