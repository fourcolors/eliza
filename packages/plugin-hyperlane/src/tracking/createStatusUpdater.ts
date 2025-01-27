import { StorageService } from '@elizaos/core'
import { MessageState, MessageUpdate } from '../types/status'

/**
 * Creates a pure function for updating message status
 */
export const createStatusUpdater = (storage: Readonly<StorageService>) => {
  return async (update: Readonly<MessageUpdate>): Promise<Readonly<MessageState>> => {
    const messageStr = await storage.getItem(`message:${update.id}`)

    if (!messageStr) {
      throw new Error('Message not found')
    }

    const message = JSON.parse(messageStr)
    const currentMetadata = message.metadata ? Object.entries(message.metadata) : []
    const updateMetadata = update.metadata ? Array.from(update.metadata.entries()) : []

    const newState = {
      ...message,
      status: update.status,
      timestamp: update.timestamp,
      metadata: new Map([...currentMetadata, ...updateMetadata])
    } as const

    const serializedState = {
      ...newState,
      metadata: Object.fromEntries(newState.metadata)
    }

    await storage.setItem(`message:${update.id}`, JSON.stringify(serializedState))
    return Object.freeze(newState)
  }
}
