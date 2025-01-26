import { type Action, type IAgentRuntime } from "@elizaos/core"
import { type HyperlaneService } from "../types/hyperlane"
import { type HyperlaneMessage } from "../types/message"

export interface SendMessageActionInput {
  readonly message: HyperlaneMessage
  readonly destinationChain: string
}

export interface SendMessageActionOutput {
  readonly messageId: string
  readonly txHash: string
}

export const createSendMessageAction = (): Action => ({
  name: "sendMessage",
  handler: async (runtime: IAgentRuntime): Promise<SendMessageActionOutput> => {
    const { message, destinationChain } = runtime.input as SendMessageActionInput
    const service = runtime.services.get("hyperlane") as HyperlaneService
    
    if (!message || !destinationChain) {
      throw new Error("message and destinationChain are required")
    }
    
    if (!service) {
      throw new Error("hyperlane service is required")
    }

    const result = await service.dispatch({
      destination: parseInt(destinationChain),
      recipient: message.recipient,
      body: message.body,
    })

    return {
      messageId: result.id,
      txHash: result.txHash,
    }
  },
})
