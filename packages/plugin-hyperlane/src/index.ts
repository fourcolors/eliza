import { Plugin } from "@elizaos/core"
import { actions } from "./actions"

/**
 * Hyperlane plugin for cross-chain messaging and interoperability
 * Provides actions for interacting with the Hyperlane protocol
 */
export const hyperlanePlugin: Plugin = {
    name: "hyperlane",
    description: "Plugin for interacting with Hyperlane protocol",
    actions,
}

export default hyperlanePlugin
