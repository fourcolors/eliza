import { Provider } from 'ethers'
import { IMailbox, IInterchainSecurityModule } from '@hyperlane-xyz/core'
import { HyperlaneMessage, MessageFilter, MessageStatus } from './message'

/**
 * Provider for Hyperlane configuration
 */
export type ConfigProvider = () => Readonly<{
  domains: ReadonlyArray<number>
  mailboxes: ReadonlyMap<number, string>
  isms: ReadonlyMap<number, string>
  gasConfig: Readonly<{
    multiplier: number
    maxPrice: bigint
  }>
}>

/**
 * Provider for message operations
 */
export type MessageProvider = Readonly<{
  listMessages: (
    filter?: Readonly<MessageFilter>
  ) => Promise<Readonly<{
    messages: ReadonlyArray<HyperlaneMessage>
    count: number
    filter?: MessageFilter
  }>>
  
  getMessage: (messageId: string) => Promise<Readonly<{
    message: HyperlaneMessage
    status: MessageStatus
  }>>
  
  saveMessage: (message: Readonly<HyperlaneMessage>) => Promise<void>
  
  updateStatus: (messageId: string, status: MessageStatus) => Promise<void>
}>

/**
 * Provider for domain-specific operations
 */
export type DomainProvider = Readonly<{
  getDomains: () => Promise<ReadonlyArray<number>>
  
  getActiveMailboxes: () => Promise<ReadonlyMap<number, IMailbox>>
  
  getMailbox: (domain: number) => Promise<IMailbox>
  
  getProvider: (domain: number) => Provider
  
  getDefaultIsm: () => Promise<IInterchainSecurityModule>
  
  getRecipientIsm: (recipient: string) => Promise<IInterchainSecurityModule>
}>

/**
 * Provider for gas estimation and management
 */
export type GasProvider = Readonly<{
  estimateGas: (domain: number, to: string, data: string) => Promise<bigint>
  
  getGasPrice: (domain: number) => Promise<bigint>
  
  validateGasPrice: (domain: number, price: bigint) => Promise<boolean>
}>

/**
 * Provider for transaction management
 */
export type TransactionProvider = Readonly<{
  sendTransaction: (domain: number, tx: Readonly<{
    to: string
    data: string
    value?: bigint
    gasLimit?: bigint
    gasPrice?: bigint
  }>) => Promise<string>
  
  getTransactionStatus: (domain: number, txHash: string) => Promise<'pending' | 'confirmed' | 'failed'>
  
  waitForTransaction: (domain: number, txHash: string) => Promise<{
    status: boolean
    gasUsed: bigint
    effectiveGasPrice: bigint
  }>
}>

/**
 * Provider for chain management operations
 */
export type ChainProvider = Readonly<{
  validateChainConfig: (
    domain: number,
    params: Readonly<{
      rpcUrl: string
      mailbox?: string
      ism?: string
    }>
  ) => Promise<boolean>

  deployChain: (
    domain: number,
    params: Readonly<{
      rpcUrl: string
      deployer: string
      ismType: 'multisig' | 'optimistic' | 'routing'
      validators?: ReadonlyArray<string>
    }>
  ) => Promise<{
    mailbox: string
    ism: string
  }>

  getChainStatus: (
    domain: number
  ) => Promise<{
    isDeployed: boolean
    mailbox?: string
    ism?: string
    validators?: ReadonlyArray<string>
  }>

  updateChainConfig: (
    domain: number,
    params: Readonly<{
      validators?: ReadonlyArray<string>
      gasConfig?: {
        multiplier?: number
        maxPrice?: bigint
      }
    }>
  ) => Promise<void>
}>
