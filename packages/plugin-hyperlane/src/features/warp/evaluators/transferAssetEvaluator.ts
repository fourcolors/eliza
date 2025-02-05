/**
 * @file /packages/plugin-hyperlane/src/features/warp/evaluators/bridgeRequestEvaluator.ts
 * Evaluates user messages for bridge requests, validates chain support, and manages the bridge request state.
 * This evaluator handles:
 * - Chain validation using WarpCore configuration
 * - Token type and amount extraction from messages
 * - Bridge request state management
 * - Validation error tracking
 */

import { HyperlaneService } from "@core/services/HyperlaneService";
import {
    composeContext,
    Evaluator,
    generateObject,
    IAgentRuntime,
    Memory,
    ServiceType,
    State,
} from "@elizaos/core";
import {
    extractTransferRequestDataFromMessage,
    TransferRequestSchema,
} from "./prompts/extractTransferRequestDataFromMessage";

import { ModelClass } from "@elizaos/core";

export const transferEvaluator: Evaluator = {
    name: "EVALUATE_TRANSFER",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // TODO: Ensure we aren't in the middle of a transfer
        return true;
    },
    similes: [
        "CHECK_TRANSFER",
        "VALIDATE_TRANSFER",
        "PARSE_TRANSFER",
        "ANALYZE_TRANSFER",
    ],
    description:
        "Evaluates and validates transfer requests by extracting token type, amount, and destination chain, managing the conversation state for token transfers",
    handler: async (runtime: IAgentRuntime, message: Memory, state: State) => {
        const hyp = runtime.getService<HyperlaneService>(ServiceType.HYPERLANE);
        const { chainMetadata } = hyp.getWarpContext();
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        state = await runtime.composeState(message, {
            chainMetadata,
        });

        const context = composeContext({
            state,
            template: extractTransferRequestDataFromMessage,
        });

        const content = await generateObject({
            runtime,
            context,
            modelClass: ModelClass.LARGE,
            schema: TransferRequestSchema,
        });

        return content;
    },
    examples: [
        // 1. All information provided (amount + chain + token)
        {
            context: `Chain Information:
    {{chainMetadata}}

    Recent Messages:
    {{recentMessages}}`,
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Transfer 5 ETH to Base",
                    },
                },
            ],
            outcome: `{
                destinationChain: "base",
                tokenType: "ETH",
                amount: "5",
            }`,
        },
        // 2. No amount (chain + token only)
        {
            context: `Chain Information:
    {{chainMetadata}}

    Recent Messages:
    {{recentMessages}}`,
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Transfer ETH to Base",
                    },
                },
            ],
            outcome: `{
                destinationChain: "base",
                tokenType: "ETH",
                amount: undefined,
            }`,
        },
        // 3. No chain (amount + token only)
        {
            context: `Chain Information:
    {{chainMetadata}}

    Recent Messages:
    {{recentMessages}}`,
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Transfer 5 ETH",
                    },
                },
            ],
            outcome: `{
                destinationChain: undefined,
                tokenType: "ETH",
                amount: "5",
            }`,
        },
        // 4. No token (amount + chain only)
        {
            context: `Chain Information:
    {{chainMetadata}}

    Recent Messages:
    {{recentMessages}}`,
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Transfer 5 to Base",
                    },
                },
            ],
            outcome: `{
                destinationChain: "base",
                tokenType: undefined,
                amount: "5",
            }`,
        },
        // 5. Only amount
        {
            context: `Chain Information:
    {{chainMetadata}}

    Recent Messages:
    {{recentMessages}}`,
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Transfer 5",
                    },
                },
            ],
            outcome: `{
                destinationChain: undefined,
                tokenType: undefined,
                amount: "5",
            }`,
        },
        // 6. Only chain
        {
            context: `Chain Information:
    {{chainMetadata}}

    Recent Messages:
    {{recentMessages}}`,
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Transfer to Base",
                    },
                },
            ],
            outcome: `{
                destinationChain: "base",
                tokenType: undefined,
                amount: undefined,
            }`,
        },
        // 7. Only token
        {
            context: `Chain Information:
    {{chainMetadata}}

    Recent Messages:
    {{recentMessages}}`,
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Transfer ETH",
                    },
                },
            ],
            outcome: `{
                destinationChain: undefined,
                tokenType: "ETH",
                amount: undefined,
            }`,
        },
        // 8. No information provided
        {
            context: `Chain Information:
    {{chainMetadata}}

    Recent Messages:
    {{recentMessages}}`,
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I want to transfer some tokens",
                    },
                },
            ],
            outcome: `{
                destinationChain: undefined,
                tokenType: undefined,
                amount: undefined,
            }`,
        },
    ],
};
