import { Action, ActionContext } from "@elizaos/core"
import { HyperlaneCore, MultiProvider } from "@hyperlane-xyz/sdk"
import { HyperlaneConfig } from "./types"

type GetMessageParams = {
    messageId: string
    chainId: string
}

/**
 * Creates a getMessage action to retrieve cross-chain messages
 * Pure function that returns an Action
 */
export const createGetMessageAction = (config: HyperlaneConfig): Action => ({
    name: "getMessage",
    description: "Retrieve a message status from Hyperlane",
    parameters: {
        messageId: { type: "string", description: "ID of the message to retrieve" },
        chainId: { type: "string", description: "Chain name where the message was sent" }
    },
    execute: async (context: ActionContext, params: GetMessageParams) => {
        const { messageId, chainId } = params
        
        try {
            const multiProvider = new MultiProvider(config.rpcEndpoints)
            if (config.privateKey) {
                multiProvider.setSharedSigner(config.privateKey)
            }
            
            const core = HyperlaneCore.fromEnvironment(multiProvider)
            const messageStatus = await core.getMessageStatus(chainId, messageId)
            
            return {
                success: true,
                data: {
                    status: messageStatus,
                    message: "Message status retrieved successfully"
                }
            }
        } catch (error) {
            return {
                success: false,
                error: `Failed to get message status: ${error.message}`
            }
        }
    }
})
