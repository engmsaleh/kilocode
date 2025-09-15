import type { RooTerminalCallbacks, RooTerminalProcessResultPromise } from "./types"
import { BaseTerminal } from "./BaseTerminal"
import { CLITerminalProcess } from "./CLITerminalProcess"
import { mergePromise } from "./mergePromise"

/**
 * Terminal implementation for CLI usage. It uses Node's child_process APIs to
 * execute commands without relying on VSCode APIs.
 */
export class CLITerminal extends BaseTerminal {
	constructor(id: number, cwd: string) {
		super("cli", id, cwd)
	}

	/**
	 * CLI terminals never close automatically. They exist for the duration of
	 * the process.
	 */
	public override isClosed(): boolean {
		return false
	}

	public override runCommand(command: string, callbacks: RooTerminalCallbacks): RooTerminalProcessResultPromise {
		this.busy = true

		const process = new CLITerminalProcess(this)
		process.command = command
		this.process = process

		process.on("line", (line) => callbacks.onLine(line, process))
		process.once("completed", (output) => callbacks.onCompleted(output, process))
		process.once("shell_execution_started", (pid) => callbacks.onShellExecutionStarted(pid, process))
		process.once("shell_execution_complete", (details) => callbacks.onShellExecutionComplete(details, process))

		const promise = new Promise<void>((resolve, reject) => {
			process.once("continue", () => resolve())
			process.once("error", (error) => reject(error))
			process.run(command)
		})

		return mergePromise(process, promise)
	}
}
