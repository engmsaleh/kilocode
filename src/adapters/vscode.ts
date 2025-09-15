/* Adapter loader that uses the real VS Code API when available
 * and falls back to a CLI implementation otherwise.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
let vscode: any
try {
	// Try to load VS Code runtime
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	vscode = require("vscode")
} catch {
	// Fallback to CLI stubs
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	vscode = require("./cli/adapters/vscode")
}

export = vscode
