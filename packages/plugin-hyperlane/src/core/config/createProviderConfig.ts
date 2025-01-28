import { JsonRpcProvider, Provider } from 'ethers';
import { PluginConfig, ProviderConfig } from '../types/config';

/**
 * Creates provider configuration from plugin config
 */
export const createProviderConfig = (config: PluginConfig): ProviderConfig => {
  // Create RPC configuration with sensible defaults
  const rpc = Object.freeze({
    retries: 3,
    timeout: 30000, // 30 seconds
    batchSize: 100
  });

  // Create storage configuration with sensible defaults
  const storage = Object.freeze({
    type: 'persistent' as const,
    path: './storage',
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  // Create monitoring configuration with sensible defaults
  const monitoring = Object.freeze({
    enabled: true,
    interval: 5000, // 5 seconds
    maxRetries: 3
  });

  // Create immutable provider config
  return Object.freeze({
    rpc,
    storage,
    monitoring,
    providers: createProviders(config.providers)
  });
};

/**
 * Creates a JsonRpcProvider for a given URL
 */
const createProvider = (url: string): JsonRpcProvider => {
  return new JsonRpcProvider(url);
};

/**
 * Creates a map of providers from domain to provider URL mapping
 */
const createProviders = (
  providers: ReadonlyMap<number, string>
): ReadonlyMap<number, Provider> => {
  const result = new Map<number, Provider>();

  for (const [domain, url] of providers.entries()) {
    result.set(domain, createProvider(url));
  }

  return Object.freeze(result);
};
