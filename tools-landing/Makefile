.PHONY: release
release: style.css
	mc cp index.html rknt/tools/index.html
	mc cp styles/main.css rknt/tools/styles.css

style.css: styles/*.css
	npx lightningcss-cli --output-file style.css --bundle styles/main.css

.PHONY: watch
watch:
	@find ./styles -name '*.css' -o -name 'index.html' | entr -r make release
