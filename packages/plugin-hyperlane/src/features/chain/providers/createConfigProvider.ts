import { PluginConfig } from '../types/config';
import { ConfigProvider } from '../types/provider';

/**
 * Creates a provider function for accessing configuration data
 * @param config Plugin configuration
 * @returns Configuration provider function
 */
export const createConfigProvider = (
  config: Readonly<PluginConfig>
): ConfigProvider => (): Readonly<Record<string, unknown>> => ({
  domains: Array.from(config.domains),
  providers: Object.fromEntries(config.providers),
  defaultIsm: config.defaultIsm,
  hooks: Object.fromEntries(config.hooks)
} as const);
