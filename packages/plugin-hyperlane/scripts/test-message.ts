import { IAgentRuntime } from "@elizaos/core";
import { HyperlanePlugin } from "../src";
import { messagingActions } from "../src/actions/messaging";

async function testMessage() {
    const plugin = new HyperlanePlugin({
        originChain: "ethereum",
        destinationChain: "optimism",
        rpcUrls: {
            ethereum: process.env.ORIGIN_CHAIN_RPC || "",
            optimism: process.env.DESTINATION_CHAIN_RPC || "",
        },
    });

    const runtime = {
        plugins: {
            get: () => plugin,
        },
        registerActions: () => {},
        registerProvider: () => {},
    } as unknown as IAgentRuntime;

    await plugin.init(runtime);

    const result = await messagingActions[0].handler(runtime, {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        agentId: "123e4567-e89b-12d3-a456-426614174001",
        roomId: "123e4567-e89b-12d3-a456-426614174002",
        content: {
            text: "Send cross-chain message",
            destinationChain: "optimism",
            destinationAddress: "0x123...",
            messageBody: "Test message",
            gasAmount: 100000,
        },
    });

    console.log("Message result:", result);
}

testMessage().catch(console.error);
