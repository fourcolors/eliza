import { type Action } from "@elizaos/core"
import { type HyperlaneConfig } from "../types/config"
import { type HyperlaneMessage } from "../types/message"
import { createMessageProvider } from "../providers/createMessageProvider"

export interface SendMessageActionInput {
  readonly message: HyperlaneMessage
  readonly destinationChain: string
  readonly config: HyperlaneConfig
}

export interface SendMessageActionOutput {
  readonly messageId: string
  readonly txHash: string
}

export const createSendMessageAction = (): Action<
  SendMessageActionInput,
  SendMessageActionOutput
> => {
  return {
    name: "sendMessage",
    execute: async ({ message, destinationChain, config }) => {
      const messageProvider = createMessageProvider(config)
      
      const { messageId, txHash } = await messageProvider.sendMessage({
        message,
        destinationChain,
      })

      return {
        messageId,
        txHash,
      }
    },
  }
}
