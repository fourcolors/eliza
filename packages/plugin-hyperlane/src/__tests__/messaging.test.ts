import { IAgentRuntime, Memory, Plugin } from "@elizaos/core";
import { beforeEach, describe, expect, test } from "vitest";
import { messagingActions } from "../actions/messaging";
import createHyperlanePlugin from "../index";
import { mockContext, mockMessage } from "./mocks";

interface MessageResult {
    status: string;
    messageId: string;
    details?: string;
}

interface StatusResult {
    status: string;
    delivered: boolean;
    messageId: string;
}

describe("Hyperlane Messaging", () => {
    let plugin: Plugin;

    beforeEach(() => {
        plugin = createHyperlanePlugin(
            {
                originChain: "ethereum",
                destinationChain: "optimism",
                rpcUrls: {
                    ethereum: "http://localhost:8545",
                    optimism: "http://localhost:8546",
                },
            },
            mockContext as unknown as IAgentRuntime
        );
    });

    test("should send cross-chain message", async () => {
        const sendAction = messagingActions.find(
            (action) => action.name === "SEND_CROSS_CHAIN_MESSAGE"
        );

        const message: Memory = {
            userId: "123e4567-e89b-12d3-a456-426614174000",
            agentId: "123e4567-e89b-12d3-a456-426614174001",
            roomId: "123e4567-e89b-12d3-a456-426614174002",
            content: {
                text: "Send message to optimism at 0x123... with body 'Hello from Ethereum!' and gas 100000",
                destinationChain: "optimism",
                destinationAddress: "0x123...",
                messageBody: "Hello from Ethereum!",
                gasAmount: 100000,
            },
        };

        const result = (await sendAction!.handler(
            mockContext as unknown as IAgentRuntime,
            message
        )) as MessageResult;

        expect(result.status).toBe("dispatched");
        expect(result.messageId).toBeDefined();
    });

    test("should check message status", async () => {
        const checkAction = messagingActions.find(
            (action) => action.name === "CHECK_MESSAGE_STATUS"
        );

        const message: Memory = {
            userId: "123e4567-e89b-12d3-a456-426614174000",
            agentId: "123e4567-e89b-12d3-a456-426614174001",
            roomId: "123e4567-e89b-12d3-a456-426614174002",
            content: {
                text: `Check status of message '${mockMessage.id}'`,
                messageId: mockMessage.id,
            },
        };

        const result = (await checkAction!.handler(
            mockContext as unknown as IAgentRuntime,
            message
        )) as StatusResult;

        expect(result.status).toBeDefined();
        expect(result.delivered).toBeDefined();
    });
});
