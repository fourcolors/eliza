/**
 * Actions for bridging assets between chains using Hyperlane
 *
 * This file contains the bridgeAssetAction action that handles cross-chain token transfers
 * using the Hyperlane messaging protocol. It validates bridge/transfer commands and
 * executes the bridging transaction through the Hyperlane Bridge.
 *
 * @actions
 * - BRIDGE_ASSET: Transfer tokens from origin to destination chain via Hyperlane bridge
 *
 * @remarks
 * Actions handle both message parsing/validation and transaction execution through
 * handlers that integrate with Hyperlane bridge contracts.
 */

import {
    type Action,
    elizaLogger,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";

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
        callback({
            text: "Bridging asset called",
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
