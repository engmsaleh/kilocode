# kilo-code CLI

The kilo-code CLI provides a Node.js entry point for local tooling around the repository. The source code lives in `src/` and the compiled executable is emitted to `dist/` via an [esbuild](https://esbuild.github.io/) script (`esbuild.mjs`).

## Prerequisites

- Node.js 20 (managed automatically in the repo via `.nvmrc` / `.tool-versions`)
- pnpm (a workspace-wide dependency declared in the root `package.json`)

## Installation

The CLI is part of the pnpm workspace, so installing dependencies from the repository root is enough:

```bash
pnpm install
```

## Development workflow

Use the watch mode to continuously rebuild the CLI into the `dist/` directory:

```bash
pnpm --filter @roo-code/cli dev
```

Every change to files under `apps/cli/src` triggers an incremental rebuild handled by esbuild. The compiled file is written to `dist/index.js` with the correct shebang so it can be executed directly.

## Production build

Create a production bundle in `dist/` by running:

```bash
pnpm --filter @roo-code/cli build
```

This command cleans the previous output and generates a fresh executable ready for distribution or invocation via the workspace bin (`kilocode`).

## Usage

After building, you can run the CLI through pnpm or directly with Node.js:

```bash
# Using the workspace bin
pnpm --filter @roo-code/cli exec kilocode --help

# Invoking the compiled file directly
node apps/cli/dist/index.js --version
```

Supported flags include:

- `--help` / `-h` (or the `help` command) to display usage information.
- `--version` / `-v` (or the `version` command) to print the CLI version sourced from `package.json`.

The CLI exits with a non-zero status code if it encounters unknown arguments, ensuring it can be scripted reliably.
