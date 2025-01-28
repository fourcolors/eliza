/**
 * /packages/plugin-hyperlane/src/features/messaging/providers/createMessageDispatchProvider.ts
 *
 * Factory for creating message dispatch providers.
 * Handles cross-chain message sending and tracking.
 */

import { elizaLogger } from "@elizaos/core";
import { MultiProtocolProvider, WarpCore } from "@hyperlane-xyz/sdk";
import { createMailbox } from "./factories/createMailbox";
import { createStatusTracker } from "./createStatusTracker";
import { MessageConfig } from "@core/types/message";
import { validateMessageConfig } from "@shared/validators/createParamsValidator";

export interface MessageDispatchProvider {
  readonly dispatchMessage: (params: {
    readonly message: MessageConfig
    readonly destinationChain: string
  }) => Promise<{
    readonly messageId: string
    readonly txHash: string
  }>
  readonly estimateGas: (params: {
    readonly message: MessageConfig
    readonly destinationChain: string
  }) => Promise<bigint>
}

export const createMessageDispatchProvider = (
  config: MessageConfig
): MessageDispatchProvider => {
  return {
    dispatchMessage: async ({ message, destinationChain }) => {
      const mailbox = createMailbox(destinationChain)
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
      const mailbox = createMailbox(destinationChain)
      return await mailbox.estimateGas.dispatch(
        destinationChain,
        message.recipient,
        message.body
      )
    },
  }
}
