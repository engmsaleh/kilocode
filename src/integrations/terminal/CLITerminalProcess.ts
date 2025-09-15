import { spawn, ChildProcess } from "child_process"
import psTree from "ps-tree"
import process from "process"

import type { RooTerminal } from "./types"
import { BaseTerminalProcess } from "./BaseTerminalProcess"

/**
 * CLI implementation of a terminal process using Node's child_process APIs.
 * This mirrors the behaviour of VSCode's TerminalProcess but is suitable for
 * running in a Node CLI environment.
 */
export class CLITerminalProcess extends BaseTerminalProcess {
	private terminalRef: WeakRef<RooTerminal>
	private subprocess?: ChildProcess
	private pid?: number
	private aborted = false

	constructor(terminal: RooTerminal) {
		super()
		this.terminalRef = new WeakRef(terminal)
		this.once("completed", () => {
			this.terminal.busy = false
		})
	}

	private get terminal(): RooTerminal {
		const terminal = this.terminalRef.deref()
		if (!terminal) {
			throw new Error("Unable to dereference terminal")
		}
		return terminal
	}

	public override async run(command: string): Promise<void> {
		this.command = command
		this.isHot = true

		this.subprocess = spawn(command, {
			cwd: this.terminal.getCurrentWorkingDirectory(),
			shell: true,
			env: {
				...process.env,
				LANG: "en_US.UTF-8",
				LC_ALL: "en_US.UTF-8",
			},
			stdio: ["ignore", "pipe", "pipe"],
		})

		this.pid = this.subprocess!.pid ?? undefined
		this.terminal.running = true
		this.emit("shell_execution_started", this.pid)

		const onData = (chunk: Buffer) => {
			if (this.aborted) {
				return
			}

			const line = chunk.toString()
			this.fullOutput += line
			process.stdout.write(line)
			const now = Date.now()
			if (this.isListening && (now - this.lastEmitTime_ms > 500 || this.lastEmitTime_ms === 0)) {
				this.emitRemainingBufferIfListening()
				this.lastEmitTime_ms = now
			}
			this.startHotTimer(line)
		}

		this.subprocess.stdout?.on("data", onData)
		this.subprocess.stderr?.on("data", onData)

		const onSigint = () => {
			this.aborted = true
			try {
				this.subprocess?.kill("SIGINT")
			} catch (e) {}
		}
		process.once("SIGINT", onSigint)

		await new Promise<void>((resolve) => {
			this.subprocess?.once("close", (code, signal) => {
				process.off("SIGINT", onSigint)
				this.terminal.setActiveStream(undefined)
				this.emitRemainingBufferIfListening()
				this.stopHotTimer()
				this.terminal.running = false
				const exitDetails = { exitCode: code === null ? undefined : code, signalName: signal ?? undefined }
				this.emit("shell_execution_complete", exitDetails)
				this.emit("completed", this.fullOutput)
				this.emit("continue")
				resolve()
			})
			this.subprocess?.once("error", (err) => {
				process.off("SIGINT", onSigint)
				this.terminal.running = false
				this.emit("error", err as Error)
				resolve()
			})
		})

		this.subprocess = undefined
	}

	public override continue(): void {
		this.isListening = false
		this.removeAllListeners("line")
		this.emit("continue")
	}

	public override abort(): void {
		this.aborted = true
		if (this.subprocess) {
			try {
				this.subprocess.kill("SIGINT")
			} catch (e) {}
			if (this.pid) {
				psTree(this.pid, (_err, children) => {
					for (const child of children) {
						const pid = parseInt(child.PID)
						if (!isNaN(pid)) {
							try {
								process.kill(pid, "SIGKILL")
							} catch (e) {}
						}
					}
				})
			}
		}
	}

	public override hasUnretrievedOutput(): boolean {
		return this.lastRetrievedIndex < this.fullOutput.length
	}

	public override getUnretrievedOutput(): string {
		let output = this.fullOutput.slice(this.lastRetrievedIndex)
		let index = output.lastIndexOf("\n")
		if (index === -1) {
			return ""
		}
		index++
		this.lastRetrievedIndex += index
		return output.slice(0, index)
	}

	private emitRemainingBufferIfListening(): void {
		if (!this.isListening) {
			return
		}
		const output = this.getUnretrievedOutput()
		if (output !== "") {
			this.emit("line", output)
		}
	}
}
