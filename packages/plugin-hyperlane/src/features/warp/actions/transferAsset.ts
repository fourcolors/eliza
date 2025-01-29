/**
 * /packages/plugin-hyperlane/src/features/warp/actions/transferAsset.ts
 *
 * Action handler for cross-chain token transfers.
 * Processes user commands to transfer tokens between supported chains using Hyperlane protocol.
 */

import { HyperlaneService } from "@core/services/HyperlaneService";
import {
    Action,
    elizaLogger,
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
        // For now, we don't need to validate, lets just try to make the transfer happen
        return true;
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
                user: "{{user2}}",
                content: {
                    text: "I'll help you transfer 100 USDC to Optimism using Hyperlane. Let me prepare the transaction.",
                    action: "TRANSFER_ASSET",
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
                    text: "I'll help you transfer your ETH from Arbitrum to Base using Hyperlane's secure messaging protocol.",
                    action: "TRANSFER_ASSET",
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
                    text: "I'll help you transfer 50 WETH from Polygon to Avalanche. Let me set up the Hyperlane warp route.",
                    action: "TRANSFER_ASSET",
                },
            },
        ],
    ],
} as Action;
