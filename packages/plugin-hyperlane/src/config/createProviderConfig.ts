import { ethers } from 'ethers';
import { PluginConfig, ProviderConfig } from '../types/config';

/**
 * Creates a provider configuration from the plugin configuration
 * @param config Plugin configuration
 * @returns Immutable provider configuration
 */
export const createProviderConfig = (
  config: Readonly<PluginConfig>
): Readonly<ProviderConfig> => Object.freeze({
  multiProvider: createMultiProvider(config),
  storage: createStorageConfig(config),
  security: createSecurityConfig(config)
} as const);

/**
 * Creates the multi-provider configuration
 */
const createMultiProvider = (config: Readonly<PluginConfig>) => {
  const providers = new Map(
    Array.from(config.domains).map(domain => [
      domain,
      new ethers.JsonRpcProvider(config.providers.get(domain.toString()))
    ])
  );

  return Object.freeze({
    providers: Object.freeze(providers),
    defaultProvider: providers.values().next().value
  });
};

/**
 * Creates the storage configuration
 */
const createStorageConfig = (config: Readonly<PluginConfig>) => Object.freeze({
  path: './storage',
  maxSize: 1024 * 1024 * 10, // 10MB
  retentionDays: 30 // Keep messages for 30 days
});

/**
 * Creates the security configuration with safe defaults
 */
const createSecurityConfig = (config: Readonly<PluginConfig>) => Object.freeze({
  ismAddress: config.defaultIsm,
  validators: Object.freeze(new Set<string>()),
  defaultGasLimit: BigInt(1000000), // 1M gas units
  maxGasPerMessage: BigInt(2000000), // 2M gas units
  retryAttempts: 3,
  retryDelayMs: 1000 // 1 second between retries
});
