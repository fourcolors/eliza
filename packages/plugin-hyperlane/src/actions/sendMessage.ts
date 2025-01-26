import { type Action } from "@elizaos/core"
import { type HyperlaneService } from "../types/hyperlane"
import { type HyperlaneMessage } from "../types/message"

export interface SendMessageActionInput {
  readonly message: HyperlaneMessage
  readonly destinationChain: string
  readonly service: HyperlaneService
}

export interface SendMessageActionOutput {
  readonly messageId: string
  readonly txHash: string
}

export const createSendMessageAction = (): Action => ({
  name: "sendMessage",
  handler: async ({ message, destinationChain, service }: SendMessageActionInput): Promise<SendMessageActionOutput> => {
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
