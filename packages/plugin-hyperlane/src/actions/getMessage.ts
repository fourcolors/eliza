import { type Action } from "@elizaos/core"
import { type HyperlaneConfig } from "../types/config"
import { type HyperlaneMessage } from "../types/message"
import { createMessageProvider } from "../providers/createMessageProvider"

export interface GetMessageActionInput {
  readonly messageId: string
  readonly config: HyperlaneConfig
}

export interface GetMessageActionOutput {
  readonly message: HyperlaneMessage
  readonly status: "pending" | "delivered" | "failed"
}

export const createGetMessageAction = (): Action<
  GetMessageActionInput,
  GetMessageActionOutput
> => {
  return {
    name: "getMessage",
    execute: async ({ messageId, config }) => {
      const messageProvider = createMessageProvider(config)
      
      const { message, status } = await messageProvider.getMessage(messageId)

      return {
        message,
        status,
      }
    },
  }
}
