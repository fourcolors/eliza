import { type Action } from "@elizaos/core"
import { createSendMessageAction } from "./sendMessage"
import { createGetMessageAction } from "./getMessage"
import { createTransferTokenAction } from "./transferToken"

/**
 * Creates Hyperlane actions
 * Using functional composition to create action handlers
 */
export const createActions = (): Action[] => [
    createSendMessageAction(),
    createGetMessageAction(),
    createTransferTokenAction()
]

// Export individual actions for direct usage
export * from "./sendMessage"
export * from "./getMessage"
export * from "./transferToken"
export * from './initializeWarpRoute'
export { createVerifyTransferAction } from './verifyTransfer'

// Export composed actions
export const actions = createActions()
