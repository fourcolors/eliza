import { type IAgentRuntime } from "@elizaos/core"
import { type HyperlaneService } from "../types/hyperlane"
import { type HyperlaneMessage } from "../types/message"
import { type ActionResult } from "../types/action"

export interface SendMessageActionInput {
  readonly message: HyperlaneMessage
  readonly destinationChain: string
}

export interface SendMessageActionOutput {
  readonly messageId: string
  readonly txHash: string
}

export const createSendMessageAction = () => ({
  name: "sendMessage",
  handler: async (runtime: IAgentRuntime): Promise<ActionResult<SendMessageActionOutput>> => {
    try {
      const { message, destinationChain } = runtime.input as SendMessageActionInput
      const service = runtime.services.get("hyperlane") as HyperlaneService
      
      if (!message || !destinationChain) {
        return {
          success: false,
          error: "message and destinationChain are required",
          metadata: new Map(),
        }
      }
      
      if (!service) {
        return {
          success: false,
          error: "hyperlane service is required",
          metadata: new Map(),
        }
      }

      const result = await service.dispatch({
        destination: parseInt(destinationChain),
        recipient: message.recipient,
        body: message.body,
      })

      return {
        success: true,
        data: {
          messageId: result.id,
          txHash: result.txHash,
        },
        metadata: new Map(),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: new Map(),
      }
    }
  },
})
