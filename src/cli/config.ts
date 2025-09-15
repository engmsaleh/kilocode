import fs from "fs/promises"
import path from "path"
import os from "os"
import YAML from "yaml"

import type { RooCodeSettings } from "@roo-code/types"

async function fileExists(p: string) {
	try {
		await fs.access(p)
		return true
	} catch {
		return false
	}
}

async function readConfigFile(filePath: string): Promise<any> {
	const content = await fs.readFile(filePath, "utf-8")
	if (filePath.endsWith(".json")) {
		return JSON.parse(content)
	}
	return YAML.parse(content)
}

export async function loadCliConfig(cwd: string): Promise<Partial<RooCodeSettings>> {
	const configCandidates = [
		path.join(cwd, ".kilocode", "settings.json"),
		path.join(cwd, ".kilocode", "settings.yaml"),
		path.join(cwd, ".kilocode", "settings.yml"),
		path.join(cwd, "kilocode.json"),
		path.join(cwd, "kilocode.yaml"),
		path.join(cwd, "kilocode.yml"),
	]

	let settings: any = {}

	for (const candidate of configCandidates) {
		if (await fileExists(candidate)) {
			settings = await readConfigFile(candidate)
			break
		}
	}

	const homeConfigCandidates = [
		path.join(os.homedir(), ".kilocode", "config"),
		path.join(os.homedir(), ".kilocode", "config.json"),
		path.join(os.homedir(), ".kilocode", "config.yaml"),
		path.join(os.homedir(), ".kilocode", "config.yml"),
	]

	let homeConfig: any = {}
	for (const candidate of homeConfigCandidates) {
		if (await fileExists(candidate)) {
			homeConfig = await readConfigFile(candidate)
			break
		}
	}

	const credentialEnvMap: Record<string, string[]> = {
		openaiApiKey: ["OPENAI_API_KEY"],
		anthropicApiKey: ["ANTHROPIC_API_KEY"],
		openRouterApiKey: ["OPENROUTER_API_KEY"],
		geminiApiKey: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
	}

	const credentials: Record<string, string> = {}
	for (const [key, envVars] of Object.entries(credentialEnvMap)) {
		for (const envVar of envVars) {
			const value = process.env[envVar]
			if (value) {
				credentials[key] = value
				break
			}
		}
		if (!credentials[key] && homeConfig[key]) {
			credentials[key] = homeConfig[key]
		}
	}

	return { ...settings, ...credentials }
}
