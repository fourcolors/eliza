import { type HyperlaneConfig } from "../types/config"
import { type HyperlaneMessage } from "../types/message"

export interface MessageDispatchProvider {
  readonly dispatchMessage: (params: {
    readonly message: HyperlaneMessage
    readonly destinationChain: string
  }) => Promise<{
    readonly messageId: string
    readonly txHash: string
  }>
  readonly estimateGas: (params: {
    readonly message: HyperlaneMessage
    readonly destinationChain: string
  }) => Promise<bigint>
}

export const createMessageDispatchProvider = (
  config: HyperlaneConfig
): MessageDispatchProvider => {
  return {
    dispatchMessage: async ({ message, destinationChain }) => {
      const mailbox = config.getMailbox(destinationChain)
      const gasEstimate = await mailbox.estimateGas.dispatch(
        destinationChain,
        message.recipient,
        message.body
      )
      
      const tx = await mailbox.dispatch(
        destinationChain,
        message.recipient,
        message.body,
        { gasLimit: gasEstimate }
      )
      
      const receipt = await tx.wait()
      const messageId = receipt.events?.[0]?.args?.messageId
      
      return {
        messageId,
        txHash: receipt.hash,
      }
    },
    
    estimateGas: async ({ message, destinationChain }) => {
      const mailbox = config.getMailbox(destinationChain)
      return await mailbox.estimateGas.dispatch(
        destinationChain,
        message.recipient,
        message.body
      )
    },
  }
}
