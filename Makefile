.DEFAULT_GOAL := help

# Optional Vite arguments, e.g. make dev ARGS="--port 5174".
ARGS ?=

.PHONY: help setup install browsers dev preview build test test-browser test-webkit check clean

help:
	@printf '%s\n' \
	  'make setup         Install locked npm dependencies (Node.js 22.12+)' \
	  'make dev           Start live development and open the local browser' \
	  'make preview       Build and open the production preview locally' \
	  'make build         Build and audit dist/' \
	  'make check         Run unit tests, release audit, and production build' \
	  'make browsers      Install Chromium and WebKit for browser tests' \
	  'make test          Run unit tests and the public release audit' \
	  'make test-browser  Run Chromium and phone tests' \
	  'make test-webkit   Run iPhone WebKit tests' \
	  'make clean         Remove dist/' \
	  '' \
	  'Start with: make setup, then make dev (or make preview).' \
	  'Pass Vite options with ARGS="--port 5174". Stop servers with Ctrl-C.'

setup: install

install:
	npm ci

browsers:
	npx --no-install playwright install chromium webkit

dev:
	npm run dev -- --open $(ARGS)

# Always rebuild so preview includes the latest local changes and production CSP.
preview: build
	npm run preview -- --open $(ARGS)

build:
	npm run build

test:
	npm test

# Playwright's webServer configuration builds and serves the production site.
test-browser:
	npm run test:browser

test-webkit:
	npm run test:webkit

check:
	npm run check

clean:
	rm -rf dist
