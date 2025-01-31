/**
 * /packages/plugin-hyperlane/src/core/services/HyperlaneService.ts
 *
 * Core service for managing Hyperlane cross-chain messaging and token transfers.
 * Provides initialization of WarpCore, chain metadata management, and registry access.
 * Acts as the central service for all Hyperlane operations across features.
 */

import { assembleChainMetadata, assembleWarpCoreConfig } from "@core/utils";
import { validateChainSupport } from "@core/validations/validateChainSupport";
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
import * as ENV from "@shared/environment.ts";

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
    private warpContext: WarpContext | null = null;
    private originChainName: string | null = null;
    private destinationChainName: string | null = null;

    async initialize(runtime: AgentRuntime): Promise<void> {
        if (this.initialized) return;

        elizaLogger.log("Initializing HyperlaneService...");

        try {
            const config = await ENV.validateHyperlaneConfig(runtime);

            this.originChainName = config.HYP_ORIGIN_CHAIN_NAME;

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

            const originValidation = validateChainSupport(
                multiProvider,
                this.originChainName
            );

            if (!originValidation.isSupported) {
                const supportedChains = Object.keys(
                    originValidation.metadata || {}
                ).join(", ");
                const errors = originValidation.errors.join(", ");
                throw new Error(
                    `Origin chain ${this.originChainName} is not supported. Supported chains: ${supportedChains} Errors: ${errors}`
                );
            }

            this.warpContext = {
                registry: githubRegistry,
                warpCore,
                multiProvider,
                chainMetadata,
            };

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

    public getOriginChainName(): string {
        if (!this.initialized || !this.originChainName) {
            throw new Error("HyperlaneService not initialized");
        }
        return this.originChainName;
    }

    public getDestinationChainName(): string {
        if (!this.initialized || !this.destinationChainName) {
            throw new Error("HyperlaneService not initialized");
        }
        return this.destinationChainName;
    }
}
