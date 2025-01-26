import { Action } from "@elizaos/core"
import { createSendMessageAction } from "./sendMessage"
import { createGetMessageAction } from "./getMessage"
import { HyperlaneConfig } from "./types"

/**
 * Creates Hyperlane actions with the provided configuration
 * Using functional composition to create action handlers
 */
export const createActions = (config: HyperlaneConfig): Action[] => [
    createSendMessageAction(config),
    createGetMessageAction(config)
]

// Export individual actions for direct usage
export * from "./types"
export * from "./sendMessage"
export * from "./getMessage"

// Default configuration from environment variables
const defaultConfig: HyperlaneConfig = {
    rpcEndpoints: process.env.HYPERLANE_RPC_ENDPOINTS ? 
        JSON.parse(process.env.HYPERLANE_RPC_ENDPOINTS) : {},
    privateKey: process.env.HYPERLANE_PRIVATE_KEY
}

// Export composed actions with default configuration
export const actions = createActions(defaultConfig)
