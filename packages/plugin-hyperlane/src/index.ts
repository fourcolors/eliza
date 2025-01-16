import {
    IAgentRuntime,
    Plugin,
    Provider,
    Service,
    ServiceType,
} from "@elizaos/core";
import {
    ChainMap,
    ChainMetadata,
    HyperlaneCore,
    MultiProvider as HyperlaneMultiProvider,
} from "@hyperlane-xyz/sdk";
import { ProtocolType } from "@hyperlane-xyz/utils";
import { deploymentActions } from "./actions/deployment";
import { messagingActions } from "./actions/messaging";
import { warpActions } from "./actions/warp";
import { getEnvironment } from "./environment";
import { MessageHandlerProvider } from "./providers/messageHandler";
import { HyperlaneConfig } from "./types";

declare module "@elizaos/core" {
    export enum ServiceType {
        HYPERLANE = "hyperlane",
    }
}

class HyperlaneService extends Service {
    private core!: HyperlaneCore;
    private providers: Provider[] = [];

    constructor(private runtime: IAgentRuntime) {
        super();
    }

    static get serviceType(): ServiceType {
        return ServiceType.HYPERLANE;
    }

    async initialize(): Promise<void> {
        const env = getEnvironment();
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
        this.core = new HyperlaneCore({}, multiProvider);

        const messageHandler = new MessageHandlerProvider(this.core);
        this.providers.push(messageHandler);
    }

    getCore(): HyperlaneCore {
        return this.core;
    }

    getProviders(): Provider[] {
        return this.providers;
    }
}

const createHyperlanePlugin = (
    config: HyperlaneConfig,
    runtime: IAgentRuntime
): Plugin => {
    const hyperlaneService = new HyperlaneService(runtime);
    const actions = [...messagingActions, ...warpActions, ...deploymentActions];

    return {
        description: "Hyperlane integration plugin for ElizaOS agents",
        name: "hyperlane",
        providers: hyperlaneService.getProviders(),
        actions,
        services: [hyperlaneService],
    };
};

export default createHyperlanePlugin;
