import * as esbuild from "esbuild"
import * as fs from "node:fs"
import * as path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function build() {
	const production = process.argv.includes("--production")
	const watch = process.argv.includes("--watch")

	const distDir = path.join(__dirname, "dist")
	if (!watch && fs.existsSync(distDir)) {
		fs.rmSync(distDir, { recursive: true, force: true })
	}

	const entryPoint = path.join(__dirname, "src/index.ts")
	const outfile = path.join(distDir, "index.js")

	const config = {
		entryPoints: [entryPoint],
		outfile,
		bundle: true,
		platform: "node",
		target: "node20",
		format: "esm",
		minify: production,
		sourcemap: true,
		logLevel: "silent",
		banner: {
			js: "#!/usr/bin/env node",
		},
		allowOverwrite: true,
	}

	const ctx = await esbuild.context(config)

	if (watch) {
		await ctx.watch()
		console.log("[cli] watching for changes...")
	} else {
		await ctx.rebuild()
		await ctx.dispose()
	}
}

build().catch((error) => {
	console.error(error)
	process.exit(1)
})
