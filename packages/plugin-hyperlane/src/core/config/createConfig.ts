import { ConfigParams, PluginConfig } from '../types/config'
import { IMailbox, IInterchainSecurityModule } from '@hyperlane-xyz/core'
import { JsonRpcProvider } from 'ethers'

/**
 * Creates immutable plugin configuration from params
 */
export const createConfig = (params: Readonly<ConfigParams>): PluginConfig => {
  validateParams(params)

  // Create immutable domain set
  const domains = Object.freeze(new Set(params.domains))

  // Create provider instances
  const providers = createProviders(params.providers)

  // Create contract instances
  const mailboxes = createMailboxes(params.mailboxes, providers)
  const isms = createIsms(params.isms, providers)
  const defaultIsm = createDefaultIsm(params.defaultIsm, providers)

  // Create hooks map
  const hooks = params.hooks ? Object.freeze(new Map(params.hooks)) : new Map()

  // Create gas config with defaults
  const gasConfig = createGasConfig(params.gasConfig)

  return Object.freeze({
    domains,
    providers,
    mailboxes,
    isms,
    defaultIsm,
    hooks,
    gasConfig
  })
}

const validateParams = (params: Readonly<ConfigParams>): void => {
  if (!params.domains || params.domains.length === 0) {
    throw new Error('At least one domain must be specified')
  }

  if (!params.providers || params.providers.size === 0) {
    throw new Error('At least one provider must be specified')
  }

  if (!params.mailboxes || params.mailboxes.size === 0) {
    throw new Error('At least one mailbox must be specified')
  }

  if (!params.isms || params.isms.size === 0) {
    throw new Error('At least one ISM must be specified')
  }

  if (!params.defaultIsm) {
    throw new Error('Default ISM address must be specified')
  }

  if (params.gasConfig) {
    validateGasConfig(params.gasConfig)
  }
}

const validateGasConfig = (
  config: NonNullable<ConfigParams['gasConfig']>
): void => {
  if (typeof config.multiplier === 'number' && config.multiplier <= 0) {
    throw new Error('Gas multiplier must be greater than 0')
  }

  if (typeof config.maxPrice === 'bigint' && config.maxPrice <= BigInt(0)) {
    throw new Error('Max gas price must be greater than 0')
  }

  if (config.perDomain) {
    for (const [domain, domainConfig] of config.perDomain.entries()) {
      if (typeof domainConfig.multiplier === 'number' && domainConfig.multiplier <= 0) {
        throw new Error(`Invalid gas multiplier for domain ${domain}`)
      }
      if (typeof domainConfig.maxPrice === 'bigint' && domainConfig.maxPrice <= BigInt(0)) {
        throw new Error(`Invalid max gas price for domain ${domain}`)
      }
    }
  }
}

const createProviders = (
  providers: ReadonlyMap<number, string>
): ReadonlyMap<number, JsonRpcProvider> => {
  const result = new Map<number, JsonRpcProvider>()
  
  for (const [domain, url] of providers.entries()) {
    result.set(domain, new JsonRpcProvider(url))
  }
  
  return Object.freeze(result)
}

const createMailboxes = (
  addresses: ReadonlyMap<number, string>,
  providers: ReadonlyMap<number, JsonRpcProvider>
): ReadonlyMap<number, IMailbox> => {
  const result = new Map<number, IMailbox>()
  
  for (const [domain, address] of addresses.entries()) {
    const provider = providers.get(domain)
    if (!provider) {
      throw new Error(`No provider found for domain ${domain}`)
    }
    // Create mailbox contract instance
    // Note: Actual implementation will depend on Hyperlane's contract factory
    result.set(domain, {} as IMailbox) // Placeholder
  }
  
  return Object.freeze(result)
}

const createIsms = (
  addresses: ReadonlyMap<number, string>,
  providers: ReadonlyMap<number, JsonRpcProvider>
): ReadonlyMap<number, IInterchainSecurityModule> => {
  const result = new Map<number, IInterchainSecurityModule>()
  
  for (const [domain, address] of addresses.entries()) {
    const provider = providers.get(domain)
    if (!provider) {
      throw new Error(`No provider found for domain ${domain}`)
    }
    // Create ISM contract instance
    // Note: Actual implementation will depend on Hyperlane's contract factory
    result.set(domain, {} as IInterchainSecurityModule) // Placeholder
  }
  
  return Object.freeze(result)
}

const createDefaultIsm = (
  address: string | undefined,
  providers: ReadonlyMap<number, JsonRpcProvider>
): IInterchainSecurityModule => {
  if (!address) {
    throw new Error('Default ISM address must be specified')
  }
  
  const provider = providers.values().next().value
  if (!provider) {
    throw new Error('No provider available for default ISM')
  }
  
  // Create ISM contract instance
  // Note: Actual implementation will depend on Hyperlane's contract factory
  return {} as IInterchainSecurityModule // Placeholder
}

const createGasConfig = (
  config: ConfigParams['gasConfig']
): PluginConfig['gasConfig'] => {
  const result = {
    multiplier: config?.multiplier ?? 1.1,
    maxPrice: config?.maxPrice ?? BigInt(100000000000),
    perDomain: config?.perDomain 
      ? Object.freeze(new Map(config.perDomain))
      : new Map()
  }

  // Validate after setting defaults
  validateGasConfig(result)

  return Object.freeze(result)
}
