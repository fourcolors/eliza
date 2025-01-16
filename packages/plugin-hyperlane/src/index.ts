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

export interface IHyperlaneService extends Service {
    getCore(): HyperlaneCore;
    getProviders(): Provider[];
}

const HYPERLANE_SERVICE_TYPE = ServiceType.HYPERLANE;

interface HyperlaneServiceState {
    core: HyperlaneCore;
    providers: Provider[];
}

const createHyperlaneServiceState = async (
    runtime: IAgentRuntime
): Promise<HyperlaneServiceState> => {
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
    const core = new HyperlaneCore(
        {
            defaultGasLimit: env.HYPERLANE_DEFAULT_GAS_LIMIT,
            timeoutSeconds: env.HYPERLANE_TIMEOUT_SECONDS,
            gasPaymentEnforced: env.HYPERLANE_GAS_PAYMENT_ENFORCED,
            chains: chainConfig,
        },
        multiProvider
    );

    try {
        await core.connect();
    } catch (error) {
        throw new Error(`Failed to initialize HyperlaneCore: ${error.message}`);
    }

    const messageHandler = new MessageHandlerProvider(core);

    return {
        core,
        providers: [messageHandler],
    };
};

const createHyperlaneService = (runtime: IAgentRuntime): IHyperlaneService => {
    let serviceState: HyperlaneServiceState | null = null;

    const service: IHyperlaneService = {
        serviceType: HYPERLANE_SERVICE_TYPE,

        initialize: async (rt: IAgentRuntime) => {
            serviceState = await createHyperlaneServiceState(rt);
        },

        getCore: () => {
            if (!serviceState) {
                throw new Error("HyperlaneService not initialized");
            }
            return serviceState.core;
        },

        getProviders: () => {
            if (!serviceState) {
                return []; // Return empty array before initialization
            }
            return serviceState.providers;
        },
    };

    return service;
};

const createHyperlanePlugin = async (
    config: HyperlaneConfig,
    runtime: IAgentRuntime
): Promise<Plugin> => {
    const hyperlaneService = createHyperlaneService(runtime);
    await hyperlaneService.initialize(runtime);

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
