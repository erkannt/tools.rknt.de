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

.PHONY: check
check: svelte-check test

.PHONY: test
test: node_modules
	npx vitest run

# Visual regression tests in Docker for reproducible screenshots
.PHONY: visual
visual: node_modules
	docker run --rm \
		--ipc=host \
		--add-host=host.docker.internal:host-gateway \
		-v $(PWD):/app \
		-w /app \
		mcr.microsoft.com/playwright:v1.58.0-noble \
		npx playwright test

# Update visual regression snapshots in Docker
.PHONY: visual-update
visual-update: node_modules
	docker run --rm \
		--ipc=host \
		--add-host=host.docker.internal:host-gateway \
		-v $(PWD):/app \
		-w /app \
		mcr.microsoft.com/playwright:v1.58.0-noble \
		npx playwright test --update-snapshots


node_modules: package.json pnpm-lock.yaml
	pnpm install --frozen-lockfile

.PHONY: clean
clean:
	rm -rf node_modules dist

.PHONY: release
release: build
	mc mirror --overwrite --remove ./dist rknt/tools/chunked-calendar
