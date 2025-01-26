import { type Action } from "@elizaos/core"
import { type StorageService } from "../types/hyperlane"
import { type HyperlaneMessage } from "../types/message"

export interface GetMessageActionInput {
  readonly messageId: string
  readonly storage: StorageService
}

export interface GetMessageActionOutput {
  readonly message: HyperlaneMessage
  readonly status: "pending" | "delivered" | "failed"
}

export const createGetMessageAction = (): Action => ({
  name: "getMessage",
  handler: async ({ messageId, storage }: GetMessageActionInput): Promise<GetMessageActionOutput> => {
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
