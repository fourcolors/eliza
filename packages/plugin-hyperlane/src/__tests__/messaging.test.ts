import { IAgentRuntime } from "@elizaos/core";
import { messagingActions } from "../actions/messaging";
import { HyperlanePlugin } from "../index";
import { mockContext, mockMessage } from "./mocks";

describe("Hyperlane Messaging", () => {
    let plugin: HyperlanePlugin;

    beforeEach(() => {
        plugin = new HyperlanePlugin({
            originChain: "ethereum",
            destinationChain: "optimism",
            rpcUrls: {
                ethereum: "http://localhost:8545",
                optimism: "http://localhost:8546",
            },
        });
    });

    test("should send cross-chain message", async () => {
        await plugin.init(mockContext as unknown as IAgentRuntime);

        const result = await messagingActions[0].execute(
            mockContext as unknown as IAgentRuntime,
            {
                destinationChain: "optimism",
                destinationAddress: "0x123...",
                messageBody: "Hello from Ethereum!",
                gasAmount: 100000,
            }
        );

        expect(result.status).toBe("dispatched");
        expect(result.messageId).toBeDefined();
    });

    test("should check message status", async () => {
        await plugin.init(mockContext as unknown as IAgentRuntime);

        const result = await messagingActions[1].execute(
            mockContext as unknown as IAgentRuntime,
            { messageId: mockMessage.id }
        );

        expect(result.status).toBeDefined();
        expect(result.delivered).toBeDefined();
    });
});
