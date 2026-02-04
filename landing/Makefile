.PHONY: dev
dev: node_modules
	npx vite --port 8080

.PHONY: release
release: dist
	mc cp dist/index.html rknt/tools/index.html
	mc mirror --overwrite --remove dist/assets rknt/tools/assets

dist: styles/*.css index.html node_modules
	npx vite build

node_modules: package.json pnpm-lock.yaml
	pnpm install --frozen-lockfile
