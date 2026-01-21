.PHONY: dev
dev: node_modules
	pnpm run dev

.PHONY: build
build: node_modules
	pnpm run build

.PHONY: prod-preview
prod-preview: node_modules
	pnpm run preview

.PHONY: release
release: build
	mc mirror --overwrite --remove ./build rknt/tools/goldcards
