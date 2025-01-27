import { ReadonlyMap } from '@elizaos/core'

/**
 * Represents the possible states of a Hyperlane message
 */
export type MessageStatus = 'pending' | 'delivered' | 'failed' | 'relayed'

/**
 * Immutable representation of a message's state
 */
export type MessageState = Readonly<{
  id: string
  status: MessageStatus
  origin: number
  destination: number
  timestamp: number
  metadata: ReadonlyMap<string, unknown>
}>

/**
 * Immutable message update type
 */
export type MessageUpdate = Readonly<{
  id: string
  status: MessageStatus
  timestamp: number
  metadata?: ReadonlyMap<string, unknown>
}>

/**
 * Filter criteria for querying messages
 */
export type MessageFilter = Readonly<{
  status?: MessageStatus
  origin?: number
  destination?: number
  fromTimestamp?: number
  toTimestamp?: number
}>
