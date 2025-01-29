/**
 * /packages/plugin-hyperlane/src/core/services/HyperlaneService.ts
 *
 * Core service for managing Hyperlane cross-chain messaging and token transfers.
 * Provides initialization of WarpCore, chain metadata management, and registry access.
 * Acts as the central service for all Hyperlane operations across features.
 */

import { assembleChainMetadata, assembleWarpCoreConfig } from "@core/utils";
import {
    AgentRuntime,
    Service,
    ServiceType as ServiceTypeEnum,
    elizaLogger,
} from "@elizaos/core";
import { GithubRegistry, IRegistry } from "@hyperlane-xyz/registry";
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
    registry: IRegistry;
    chainMetadata: ChainMap<ChainMetadata>;
}

export class HyperlaneService extends Service {
    static serviceType: ServiceTypeEnum = ServiceTypeEnum.HYPERLANE;

    private initialized: boolean = false;
    private runtime: AgentRuntime | null = null;
    private warpContext: WarpContext | null = null;

    async initialize(runtime: AgentRuntime): Promise<void> {
        if (this.initialized) return;

        elizaLogger.log("Initializing HyperlaneService...");

        try {
            const githubRegistry = new GithubRegistry();
            const coreConfig = assembleWarpCoreConfig();
            const chainsInTokens = Array.from(
                new Set(coreConfig.tokens.map((t) => t.chainName))
            );

            await githubRegistry.listRegistryContent();
            const { chainMetadata, chainMetadataWithOverrides } =
                await assembleChainMetadata(chainsInTokens, githubRegistry, {});
            const multiProvider = new MultiProtocolProvider(
                chainMetadataWithOverrides
            );
            const warpCore = WarpCore.FromConfig(multiProvider, coreConfig);

            this.warpContext = {
                registry: githubRegistry,
                warpCore,
                multiProvider,
                chainMetadata,
            };

            this.runtime = runtime;
            this.initialized = true;
        } catch (error) {
            elizaLogger.error("Failed to initialize HyperlaneService:", error);
            this.warpContext = {
                registry: new GithubRegistry(),
                chainMetadata: {},
                multiProvider: new MultiProtocolProvider({}),
                warpCore: new WarpCore(new MultiProtocolProvider({}), []),
            };
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
