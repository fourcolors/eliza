import { Provider } from 'ethers';
import { IMailbox, IInterchainSecurityModule, IPostDispatchHook } from '@hyperlane-xyz/core';

/**
 * Core message type for cross-chain communication
 */
export type HyperlaneMessage = Readonly<{
  id: string;
  sender: string;
  recipient: string;
  origin: number;
  destination: number;
  body: string;
  metadata?: ReadonlyMap<string, unknown>;
}>;

/**
 * Filter for querying messages
 */
export type MessageFilter = Readonly<{
  origin?: number;
  destination?: number;
  status?: 'pending' | 'delivered' | 'failed';
}>;

/**
 * Parameters for message dispatch
 */
export type DispatchParams = Readonly<{
  destination: number;
  recipient: string;
  body: string;
  hookMetadata?: string;
  customHook?: IPostDispatchHook;
}>;

/**
 * Result of message dispatch
 */
export type DispatchResult = Readonly<{
  id: string;
  message: HyperlaneMessage;
  txHash: string;
  fee: bigint;
}>;

/**
 * Parameters for message processing
 */
export type ProcessParams = Readonly<{
  metadata: string;
  message: string;
}>;

/**
 * Result of message processing
 */
export type ProcessResult = Readonly<{
  success: boolean;
  messageId: string;
  origin: number;
  sender: string;
  recipient: string;
  error?: string;
}>;

/**
 * Core service interface for Hyperlane integration
 */
export interface HyperlaneService {
  // Core Mailbox interactions
  readonly getMailbox: (domain: number) => Promise<IMailbox>;
  readonly dispatch: (params: Readonly<DispatchParams>) => Promise<Readonly<DispatchResult>>;
  readonly process: (params: Readonly<ProcessParams>) => Promise<Readonly<ProcessResult>>;
  
  // Provider management
  readonly getProvider: (domain: number) => Provider;
  readonly getDomains: () => ReadonlyArray<number>;
  
  // Security
  readonly getDefaultIsm: () => Promise<IInterchainSecurityModule>;
  readonly getRecipientIsm: (recipient: string) => Promise<IInterchainSecurityModule>;
  readonly isDelivered: (messageId: string) => Promise<boolean>;
  
  // Fee estimation
  readonly quoteDispatch: (params: Readonly<DispatchParams>) => Promise<bigint>;
}

/**
 * Storage service for message persistence
 */
export interface StorageService {
  readonly saveMessage: (message: Readonly<HyperlaneMessage>) => Promise<void>;
  readonly getMessage: (id: string) => Promise<Readonly<HyperlaneMessage>>;
  readonly listMessages: (filter?: Readonly<MessageFilter>) => Promise<ReadonlyArray<HyperlaneMessage>>;
}
