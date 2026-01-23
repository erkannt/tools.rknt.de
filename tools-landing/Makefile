.PHONY: dev
dev:
	npx vite --port 8080

.PHONY: release
release: dist
	mc cp dist/index.html rknt/tools/index.html
	mc mirror --overwrite --remove dist/assets rknt/tools/assets

dist: styles/*.css index.html
	npx vite build
