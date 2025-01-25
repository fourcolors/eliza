import { IAgentRuntime, Plugin } from "@elizaos/core";
import { beforeEach, describe, test } from "vitest";
import createHyperlanePlugin from "../index";
import { mockContext } from "./mocks";

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

    test.skip("should send cross-chain message", async () => {
        // TODO: Implement this test after warp routes are working
    });

    test.skip("should check message status", async () => {
        // TODO: Implement this test after warp routes are working
    });
});
