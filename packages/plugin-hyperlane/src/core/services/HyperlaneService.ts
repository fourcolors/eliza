/**
 * /packages/plugin-hyperlane/src/core/services/HyperlaneService.ts
 *
 * Core service for managing Hyperlane cross-chain messaging and token transfers.
 * Provides initialization of WarpCore, chain metadata management, and registry access.
 * Acts as the central service for all Hyperlane operations across features.
 */

import {
  Service,
  AgentRuntime,
  ServiceType as ServiceTypeEnum,
  elizaLogger
} from "@elizaos/core";
import { GithubRegistry, warpRouteConfigs } from "@hyperlane-xyz/registry";
import {
  ChainMap,
  ChainMetadata,
  MultiProtocolProvider,
  WarpCore,
} from "@hyperlane-xyz/sdk";

/**
 * Context for Warp operations
 */
interface WarpContext {
  warpCore: WarpCore;
  multiProvider: MultiProtocolProvider;
  registry: GithubRegistry;
  chainMetadata: ChainMap<ChainMetadata>;
}

export class HyperlaneService extends Service {
  static serviceType: ServiceTypeEnum = ServiceTypeEnum.HYPERLANE;

  private initialized: boolean = false;
  private runtime: AgentRuntime | null = null;
  private warpContext: WarpContext | null = null;

  constructor() {
    super();
  }

  async initialize(runtime: AgentRuntime): Promise<void> {
    if (this.initialized) return;

    elizaLogger.log("Initializing HyperlaneService");

    try {
      const registry = new GithubRegistry();

      const chainMetadata = await registry.getMetadata();
      const multiProvider = new MultiProtocolProvider(chainMetadata);

      const warpCore = WarpCore.FromConfig(
        multiProvider,
        warpRouteConfigs
      );

      this.warpContext = {
        registry,
        warpCore,
        multiProvider,
        chainMetadata,
      };

      this.runtime = runtime;
      this.initialized = true;
      elizaLogger.log("WarpCore:", warpCore);
      elizaLogger.log("HyperlaneService initialized");
    } catch (error) {
      elizaLogger.error("Failed to initialize HyperlaneService:", error);
      throw error;
    }
  }

  public getWarpContext(): WarpContext {
    if (!this.initialized || !this.warpContext) {
      throw new Error("HyperlaneService not initialized");
    }
    return this.warpContext;
  }
}
