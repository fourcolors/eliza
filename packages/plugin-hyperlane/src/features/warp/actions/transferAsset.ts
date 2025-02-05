/**
 * /packages/plugin-hyperlane/src/features/warp/actions/transferAsset.ts
 *
 * Action handler for cross-chain token transfers.
 * Processes user commands to transfer tokens between supported chains using Hyperlane protocol.
 */

import { HyperlaneService } from "@core/services/HyperlaneService";
import { validateChainSupport } from "@core/validations/validateChainSupport";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ServiceType,
    State,
} from "@elizaos/core";

export const transferAssetAction: Action = {
    name: "TRANSFER_ASSET",
    similes: ["SEND_ASSET", "MOVE_ASSET", "WARP_ASSET", "BRIDGE_ASSET"],
    description: "Transfer an asset from one chain to another using Hyperlane",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const hyp = runtime.getService<HyperlaneService>(ServiceType.HYPERLANE);
        const warpContext = hyp.getWarpContext();
        const originChain = hyp.getOriginChainName();
        // TODO: Add destination chain by...
        // 1. Create a new template file that will take a prompt warp core configuration
        // 2. Call with the prompt, the prompt will extract which chain the user wanted from the configuration file and return the name or return null if the chain is not supported
        // 3. It will then set the desitation chain in the service and return it
        // const destinationChain = hyp.getDestinationChainName();
        // For now lets hard code the destinatio to be
        const destinationChain = "basesepolia";
        const { multiProvider, warpCore } = warpContext;

        // 1. Chain and Protocol Validations
        const originValidation = validateChainSupport(
            multiProvider,
            originChain
        );

        const destValidation = validateChainSupport(
            multiProvider,
            destinationChain
        );

        return originValidation.isSupported && destValidation.isSupported;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        const hyp = runtime.getService<HyperlaneService>(ServiceType.HYPERLANE);
        const warpContext = hyp.getWarpContext();
        const { multiProvider } = warpContext;

        callback({
            text: `Available chains for transfers: ${Object.keys(warpContext.chainMetadata).join(", ")}`,
        });

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Transfer 100 USDC from Ethereum to Optimism",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "I'll help you transfer 100 USDC from Ethereum to Optimism using Hyperlane.",
                },
            },
        ],
    ],
};
