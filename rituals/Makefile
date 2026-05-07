.PHONY: dev
dev: node_modules
	npx vite --port 8080

.PHONY: build
build: node_modules
	npx vite build

.PHONY: prod
prod: node_modules build
	npx vite preview --port 8080

.PHONY: svelte-check
svelte-check: node_modules
	npx svelte-check --tsconfig ./tsconfig.app.json && npx tsc -p tsconfig.node.json

.PHONY: test
test: node_modules
	pnpm test

.PHONY: check
check: svelte-check test

.PHONY: e2e
e2e:
	./scripts/e2e.sh

node_modules: package.json pnpm-lock.yaml
	pnpm install --frozen-lockfile

.PHONY: clean
clean:
	rm -rf node_modules dist

.PHONY: release
release: build
	mc mirror --overwrite --remove ./dist rknt/tools/rituals

