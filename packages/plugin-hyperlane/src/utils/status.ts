import { HyperlaneService } from '../types/hyperlane'
import { MessageState, MessageStatus } from '../types/status'

/**
 * Pure function to determine message status
 */
export const determineMessageStatus = async (
  message: Readonly<MessageState>,
  hyperlane?: Readonly<HyperlaneService>
): Promise<MessageStatus> => {
  if (message.status === 'failed') {
    return 'failed'
  }

  if (message.status === 'relayed') {
    return 'relayed'
  }

  if (!hyperlane) {
    return message.status
  }

  try {
    const mailbox = await hyperlane.getMailbox(message.origin)
    const delivered = await mailbox.delivered(message.id)
    return delivered ? 'delivered' : 'pending'
  } catch (error) {
    return 'failed'
  }
}

/**
 * Pure function to validate message status transitions
 */
export const validateStatusTransition = (
  currentStatus: MessageStatus,
  newStatus: MessageStatus
): boolean => {
  const validTransitions: Record<MessageStatus, MessageStatus[]> = {
    pending: ['delivered', 'failed'],
    delivered: ['relayed', 'failed'],
    failed: [],
    relayed: []
  }

  return validTransitions[currentStatus]?.includes(newStatus) ?? false
}
