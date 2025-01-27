import { Provider } from 'ethers'
import { IInterchainSecurityModule, IMailbox, IPostDispatchHook } from '@hyperlane-xyz/core'

/**
 * Configuration parameters for plugin initialization
 */
export type ConfigParams = Readonly<{
  // Chain domains to support
  domains: ReadonlyArray<number>
  
  // RPC providers for each domain
  providers: ReadonlyMap<number, string>
  
  // Mailbox contract addresses for each domain
  mailboxes: ReadonlyMap<number, string>
  
  // ISM contract addresses for each domain
  isms: ReadonlyMap<number, string>
  
  // Default ISM address if none specified
  defaultIsm?: string
  
  // Post-dispatch hooks
  defaultHook?: IPostDispatchHook
  requiredHook?: IPostDispatchHook
  hooks?: ReadonlyMap<string, IPostDispatchHook>
  
  // Gas configuration
  gasConfig?: Readonly<{
    multiplier?: number
    maxPrice?: bigint
    perDomain?: ReadonlyMap<number, {
      multiplier?: number
      maxPrice?: bigint
    }>
  }>
}>

/**
 * Core plugin configuration after initialization
 */
export type PluginConfig = Readonly<{
  // Active chain domains
  domains: ReadonlySet<number>
  
  // RPC providers
  providers: ReadonlyMap<number, Provider>
  
  // Contract instances
  mailboxes: ReadonlyMap<number, IMailbox>
  isms: ReadonlyMap<number, IInterchainSecurityModule>
  defaultIsm: IInterchainSecurityModule
  
  // Post-dispatch hooks
  defaultHook?: IPostDispatchHook
  requiredHook?: IPostDispatchHook
  hooks: ReadonlyMap<string, IPostDispatchHook>
  
  // Gas configuration
  gasConfig: Readonly<{
    multiplier: number
    maxPrice: bigint
    perDomain: ReadonlyMap<number, {
      multiplier: number
      maxPrice: bigint
    }>
  }>
}>

/**
 * Provider configuration for external services
 */
export type ProviderConfig = Readonly<{
  // RPC configuration
  rpc: Readonly<{
    retries: number
    timeout: number
    batchSize: number
  }>
  
  // Storage configuration
  storage: Readonly<{
    type: 'memory' | 'persistent'
    path?: string
    maxSize?: number
  }>
  
  // Monitoring configuration
  monitoring: Readonly<{
    enabled: boolean
    interval: number
    maxRetries: number
  }>
}>

/**
 * Chain-specific configuration
 */
export type ChainConfig = Readonly<{
  // Chain identifiers
  id: number
  name: string
  
  // Contract addresses
  mailbox: string
  ism: string
  
  // RPC configuration
  rpc: Readonly<{
    url: string
    fallbacks?: ReadonlyArray<string>
  }>
  
  // Gas configuration
  gas?: Readonly<{
    multiplier?: number
    maxPrice?: bigint
  }>
}>
