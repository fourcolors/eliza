import { type Action, type IAgentRuntime } from "@elizaos/core"
import { type StorageService } from "../types/hyperlane"
import { type HyperlaneMessage } from "../types/message"

export interface GetMessageActionInput {
  readonly messageId: string
}

export interface GetMessageActionOutput {
  readonly message: HyperlaneMessage
  readonly status: "pending" | "delivered" | "failed"
}

export const createGetMessageAction = (): Action => ({
  name: "getMessage",
  handler: async (runtime: IAgentRuntime): Promise<GetMessageActionOutput> => {
    const { messageId } = runtime.input as GetMessageActionInput
    const storage = runtime.services.get("storage") as StorageService
    
    if (!messageId) {
      throw new Error("messageId is required")
    }
    
    if (!storage) {
      throw new Error("storage service is required")
    }

    const message = await storage.getMessage(messageId)
    if (!message) {
      throw new Error(`Message ${messageId} not found`)
    }

    const status = await storage.getMessageStatus(messageId)

    return {
      message,
      status,
    }
  },
})
