import { Provider } from 'ethers';
import { IInterchainSecurityModule, IPostDispatchHook } from '@hyperlane-xyz/core';

/**
 * Configuration parameters for plugin initialization
 */
export type ConfigParams = Readonly<{
  domains: ReadonlyArray<number>;
  providers: ReadonlyArray<[string, string]>;
  defaultIsm?: string;
  defaultHook?: IPostDispatchHook;
  requiredHook?: IPostDispatchHook;
  hooks?: ReadonlyArray<[string, unknown]>;
}>;

/**
 * Core plugin configuration
 */
export type PluginConfig = Readonly<{
  domains: ReadonlySet<number>;
  providers: ReadonlyMap<string, string>;
  defaultIsm?: string;
  defaultHook?: IPostDispatchHook;
  requiredHook?: IPostDispatchHook;
  hooks: ReadonlyMap<string, unknown>;
}>;

/**
 * Provider configuration for external services
 */
export type ProviderConfig = Readonly<{
  multiProvider: Readonly<{
    providers: ReadonlyMap<number, Provider>;
    defaultProvider: Provider;
  }>;
  storage: Readonly<{
    path: string;
    maxSize: number;
    retentionDays: number;
  }>;
  security: Readonly<{
    ismAddress?: string;
    validators: ReadonlySet<string>;
    defaultGasLimit: bigint;
    maxGasPerMessage: bigint;
    retryAttempts: number;
    retryDelayMs: number;
  }>;
}>;
