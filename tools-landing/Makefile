.PHONY: dev
dev:
	npx vite --port 8080

.PHONY: release
release: dist
	mc mirror --overwrite --remove dist rknt/tools

dist: styles/*.css index.html
	npx vite build
