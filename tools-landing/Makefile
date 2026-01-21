.PHONY: release
release: style.css
	mc cp index.html rknt/tools/index.html

style.css: styles
	npx lightningcss-cli --output-file style.css --bundle styles/main.css
