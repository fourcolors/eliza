import { ConfigParams, PluginConfig } from '../types/config';

/**
 * Creates an immutable plugin configuration from the provided parameters
 * @param params Configuration parameters
 * @returns Immutable plugin configuration
 */
export const createConfig = (
  params: Readonly<ConfigParams>
): Readonly<PluginConfig> => {
  // Create frozen sets and maps for true immutability
  const domains = Object.freeze(new Set(params.domains));
  const providers = Object.freeze(new Map(params.providers));
  const hooks = Object.freeze(new Map(params.hooks ?? []));

  return Object.freeze({
    domains,
    providers,
    defaultIsm: params.defaultIsm,
    hooks
  });
};
