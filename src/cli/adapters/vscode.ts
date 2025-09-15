import fs from "fs/promises"
import path from "path"

export const Uri = {
	file: (fsPath: string) => ({ fsPath }),
	joinPath: (...paths: any[]) => ({ fsPath: path.join(...paths.map((p) => (typeof p === "string" ? p : p.fsPath))) }),
}

export const workspace = {
	fs: {
		readFile: (uri: any) => fs.readFile(uri.fsPath),
		writeFile: (uri: any, data: Uint8Array) => fs.writeFile(uri.fsPath, data),
		stat: (uri: any) => fs.stat(uri.fsPath),
		createDirectory: (uri: any) => fs.mkdir(uri.fsPath, { recursive: true }),
	},
	openTextDocument: async (uri: any) => {
		const fsPath = typeof uri === "string" ? uri : uri.fsPath
		const content = await fs.readFile(fsPath, "utf8")
		return { uri: { fsPath }, getText: () => content } as any
	},
	getWorkspaceFolder: (_: any) => undefined,
}

export const window = {
	showInformationMessage: async (message: string) => {
		console.log(message)
		return message
	},
	showWarningMessage: async (message: string) => {
		console.warn(message)
		return message
	},
	showErrorMessage: async (message: string) => {
		console.error(message)
		return message
	},
}

export const commands = {
	executeCommand: async (_command: string, ..._args: any[]) => {},
}

export const extensions = {
	getExtension: (_name: string) => undefined,
}

export const env = {
	appRoot: process.cwd(),
}

export default {
	Uri,
	workspace,
	window,
	commands,
	extensions,
	env,
}
