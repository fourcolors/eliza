import { Action, ActionContext } from "@elizaos/core"
import { HyperlaneCore, MultiProvider } from "@hyperlane-xyz/sdk"
import { HyperlaneMessage, HyperlaneConfig } from "./types"

/**
 * Creates a sendMessage action for cross-chain communication
 * Pure function that returns an Action
 */
export const createSendMessageAction = (config: HyperlaneConfig): Action => ({
    name: "sendMessage",
    description: "Send a message across chains using Hyperlane",
    parameters: {
        originChain: { type: "string", description: "Origin chain name" },
        destinationChain: { type: "string", description: "Destination chain name" },
        message: { type: "string", description: "Message to send" },
        gasAmount: { type: "string", description: "Gas amount for message delivery", optional: true }
    },
    execute: async (context: ActionContext, params: HyperlaneMessage) => {
        const { originChain, destinationChain, message, gasAmount } = params
        
        try {
            const multiProvider = new MultiProvider(config.rpcEndpoints)
            if (config.privateKey) {
                multiProvider.setSharedSigner(config.privateKey)
            }
            
            const core = HyperlaneCore.fromEnvironment(multiProvider)
            const messageTx = await core.sendMessage({
                origin: originChain,
                destination: destinationChain,
                messageBody: message,
                value: gasAmount
            })
            
            return {
                success: true,
                data: {
                    transactionHash: messageTx.hash,
                    message: "Message sent successfully"
                }
            }
        } catch (error) {
            return {
                success: false,
                error: `Failed to send message: ${error.message}`
            }
        }
    }
})
