import type { UUID } from '@elizaos/core'

/**
 * Core message type for cross-chain communication
 * Extends Hyperlane's message format with ElizaOS specifics
 */
export type HyperlaneMessage = Readonly<{
  id: UUID
  sender: string
  recipient: string
  origin: number
  destination: number
  body: string
  timestamp: number
  metadata?: ReadonlyMap<string, unknown>
}>

/**
 * Status of a cross-chain message
 */
export type MessageStatus = 'pending' | 'delivered' | 'failed'

/**
 * Filter for querying messages
 */
export type MessageFilter = Readonly<{
  status?: MessageStatus
  origin?: number
  destination?: number
  fromTimestamp?: number
  toTimestamp?: number
  sender?: string
  recipient?: string
}>

/**
 * Parameters for dispatching a message
 */
export type DispatchParams = Readonly<{
  destination: number
  recipient: string
  body: string
  metadata?: ReadonlyMap<string, unknown>
}>

/**
 * Result of a message dispatch operation
 */
export type DispatchResult = Readonly<{
  id: UUID
  message: HyperlaneMessage
  txHash: string
  fee: bigint
}>

/**
 * Parameters for processing an incoming message
 */
export type ProcessParams = Readonly<{
  metadata: string
  message: string
}>

/**
 * Result of processing an incoming message
 */
export type ProcessResult = Readonly<{
  success: boolean
  messageId: UUID
  origin: number
  sender: string
  recipient: string
  error?: string
}>
