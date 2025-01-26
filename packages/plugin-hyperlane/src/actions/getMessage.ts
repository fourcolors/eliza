import { type IAgentRuntime } from "@elizaos/core"
import { type StorageService } from "../types/hyperlane"
import { type HyperlaneMessage } from "../types/message"
import { type ActionResult } from "../types/action"

export interface GetMessageActionInput {
  readonly messageId: string
}

export interface GetMessageActionOutput {
  readonly message: HyperlaneMessage
  readonly status: "pending" | "delivered" | "failed"
}

export const createGetMessageAction = () => ({
  name: "getMessage",
  handler: async (runtime: IAgentRuntime): Promise<ActionResult<GetMessageActionOutput>> => {
    try {
      const { messageId } = runtime.input as GetMessageActionInput
      const storage = runtime.services.get("storage") as StorageService
      
      if (!messageId) {
        return {
          success: false,
          error: "messageId is required",
          metadata: new Map(),
        }
      }
      
      if (!storage) {
        return {
          success: false,
          error: "storage service is required",
          metadata: new Map(),
        }
      }

      const message = await storage.getMessage(messageId)
      if (!message) {
        return {
          success: false,
          error: `Message ${messageId} not found`,
          metadata: new Map(),
        }
      }

      const status = await storage.getMessageStatus(messageId)

      return {
        success: true,
        data: {
          message,
          status,
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
