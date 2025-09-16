import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageJsonPath = path.resolve(__dirname, "../package.json")

function readPackageVersion(): string {
	try {
		const raw = fs.readFileSync(packageJsonPath, "utf8")
		const data = JSON.parse(raw) as { version?: unknown }
		if (typeof data.version === "string" && data.version.trim() !== "") {
			return data.version
		}
	} catch (error) {
		if (process.env.KILO_CODE_CLI_DEBUG) {
			console.error(`[kilo-code] Failed to read package.json: ${String(error)}`)
		}
	}

	return "0.0.0"
}

const version = readPackageVersion()

function printHelp() {
	const helpMessage = `kilo-code CLI (v${version})

Usage:
  pnpm --filter @roo-code/cli dev    # Rebuild on changes and emit to dist/
  pnpm --filter @roo-code/cli build  # Create a production bundle in dist/
  node dist/index.js [options]       # Run the compiled CLI manually

Options:
  -h, --help               Show this usage information.
  help                     Alias for --help.
  -v, --version            Print the CLI version.
  version                  Alias for --version.
`
	console.log(helpMessage)
}

const args = process.argv.slice(2)
const normalized = args.map((value) => value.toLowerCase())

if (normalized.length === 0 || normalized.includes("--help") || normalized.includes("-h") || normalized[0] === "help") {
	printHelp()
	process.exit(0)
}

if (normalized.includes("--version") || normalized.includes("-v") || normalized[0] === "version") {
	console.log(version)
	process.exit(0)
}

console.error(`Unknown arguments: ${args.join(" ")}`)
console.error("Run `kilocode --help` to see available options.")
process.exit(1)
