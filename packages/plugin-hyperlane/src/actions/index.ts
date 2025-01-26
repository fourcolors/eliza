import { type Action } from "@elizaos/core"
import { createSendMessageAction } from "./sendMessage"
import { createGetMessageAction } from "./getMessage"

/**
 * Creates Hyperlane actions
 * Using functional composition to create action handlers
 */
export const createActions = (): Action[] => [
    createSendMessageAction(),
    createGetMessageAction()
]

// Export individual actions for direct usage
export * from "./sendMessage"
export * from "./getMessage"

// Export composed actions
export const actions = createActions()
