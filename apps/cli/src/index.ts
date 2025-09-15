import * as readline from "readline"
import * as dotenvx from "@dotenvx/dotenvx"
import * as path from "path"

import { TelemetryService, PostHogTelemetryClient } from "@roo-code/telemetry"
import { ContextProxy } from "../../src/core/config/ContextProxy.ts"

class Agent {
	async handlePrompt(prompt: string): Promise<string> {
		// Placeholder for real agent dispatch
		return `Echo: ${prompt}`
	}
}

async function main() {
	// Load environment variables from .env file
	try {
		const envPath = path.join(__dirname, "..", ".env")
		dotenvx.config({ path: envPath })
	} catch (e) {
		console.warn("Failed to load environment variables:", e)
	}

	// Minimal stub for VS Code ExtensionContext
	const extensionContext: any = {
		globalState: {
			get: () => undefined,
			update: async () => undefined,
		},
		secrets: {
			get: async () => undefined,
			store: async () => undefined,
			delete: async () => undefined,
		},
		subscriptions: [],
		extensionPath: process.cwd(),
		extensionUri: { fsPath: process.cwd() },
		globalStorageUri: { fsPath: path.join(process.cwd(), ".roo") },
		logUri: { fsPath: path.join(process.cwd(), ".roo", "log") },
	}

	await ContextProxy.getInstance(extensionContext)

	const telemetry = TelemetryService.createInstance()
	try {
		telemetry.register(new PostHogTelemetryClient())
	} catch (error) {
		console.warn("Failed to register Telemetry client:", error)
	}

	const agent = new Agent()

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	const promptLoop = () => {
		rl.question("> ", async (input) => {
			if (input.trim().toLowerCase() === "exit") {
				rl.close()
				return
			}

			const response = await agent.handlePrompt(input)
			console.log(response)
			promptLoop()
		})
	}

	rl.on("close", () => process.exit(0))
	promptLoop()
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
