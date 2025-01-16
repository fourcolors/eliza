import { IAgentRuntime, Plugin, Provider } from "@elizaos/core";
import {
    ChainMap,
    ChainMetadata,
    HyperlaneCore,
    MultiProvider as HyperlaneMultiProvider,
} from "@hyperlane-xyz/sdk";
import { ProtocolType } from "@hyperlane-xyz/utils";
import { messagingActions } from "./actions/messaging";
import { getEnvironment } from "./environment";
import { MessageHandlerProvider } from "./providers/messageHandler";
import { HyperlaneConfig } from "./types";

export class HyperlanePlugin implements Plugin {
    private config: HyperlaneConfig;
    private core!: HyperlaneCore;
    public description = "Hyperlane integration plugin for ElizaOS agents";
    public name = "hyperlane";
    public providers: Provider[] = [];
    public actions = messagingActions;

    constructor(config: HyperlaneConfig) {
        this.config = config;
    }

    async init(runtime: IAgentRuntime): Promise<void> {
        const env = getEnvironment();

        // Create chain metadata map according to Hyperlane's requirements
        const chainConfig: ChainMap<ChainMetadata> = {
            [env.ORIGIN_CHAIN.name]: {
                name: env.ORIGIN_CHAIN.name,
                protocol: ProtocolType.Ethereum,
                chainId: env.ORIGIN_CHAIN.chainId,
                rpcUrls: [{ http: env.ORIGIN_CHAIN.rpc }],
            },
            [env.DESTINATION_CHAIN.name]: {
                name: env.DESTINATION_CHAIN.name,
                protocol: ProtocolType.Ethereum,
                chainId: env.DESTINATION_CHAIN.chainId,
                rpcUrls: [{ http: env.DESTINATION_CHAIN.rpc }],
            },
        };

        const multiProvider = new HyperlaneMultiProvider(chainConfig);

        this.core = new HyperlaneCore(
            {}, // contractsMap - will be populated by SDK
            multiProvider
        );

        // Register all actions individually
        for (const action of this.actions) {
            runtime.registerAction(action);
        }

        // Add message handler provider to plugin's providers
        const messageHandler = new MessageHandlerProvider(this.core);
        this.providers.push(messageHandler);
    }

    getConfig(): HyperlaneConfig {
        return this.config;
    }
}

export default HyperlanePlugin;
