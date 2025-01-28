/**
 * /packages/plugin-hyperlane/src/features/bridge/actions/bridgeAsset.ts
 *
 * Action handler for cross-chain token transfers.
 * Processes user commands to bridge tokens between supported chains using Hyperlane protocol.
 */

import {
    Action,
    elizaLogger,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ServiceType,
    State,
} from "@elizaos/core";
import { HyperlaneService } from "@core/services/HyperlaneService";
import { validateTokenTransfer } from "@shared/validators/tokenValidators";

export const bridgeAssetAction: Action = {
    name: "BRIDGE_ASSET",
    similes: ["SEND_ASSET", "TRANSFER_ASSET", "MOVE_ASSET", "WARP_ASSET"],
    description: "Bridge an asset from one chain to another using Hyperlane",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const keywords = ["bridge", "send", "transfer", "move", "warp"];

        return keywords.some((keyword) =>
            message.content.text.toLowerCase().includes(keyword)
        );
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Bridging asset called");
        const hyp = runtime.getService<HyperlaneService>(ServiceType.HYPERLANE);
        const warpContext = hyp.getWarpContext();
        elizaLogger.log("WarpContext:", {
            chainMetadata: Object.keys(warpContext.chainMetadata),
            warpCore: warpContext.warpCore,
            multiProvider: warpContext.multiProvider,
            registry: warpContext.registry,
        });
        callback({
            text: `Available chains for bridging: ${Object.keys(warpContext.chainMetadata).join(", ")}`,
        });

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Bridge 100 USDC from Ethereum to Optimism",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you bridge 100 USDC to Optimism using Hyperlane. Let me prepare the transaction.",
                    action: "BRIDGE_ASSET",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you help me transfer my ETH from Arbitrum to Base?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you bridge your ETH from Arbitrum to Base using Hyperlane's secure messaging protocol.",
                    action: "BRIDGE_ASSET",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to warp 50 WETH from Polygon to Avalanche",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you bridge 50 WETH from Polygon to Avalanche. Let me set up the Hyperlane warp route.",
                    action: "BRIDGE_ASSET",
                },
            },
        ],
    ],
} as Action;
