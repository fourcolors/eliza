import { IAgentRuntime } from "@elizaos/core";
import createHyperlanePlugin from "../src";
import { messagingActions } from "../src/actions/messaging";

async function testMessage() {
    const runtime = {
        plugins: [],
        registerActions: () => {},
        registerProvider: () => {},
    } as unknown as IAgentRuntime;

    const plugin = createHyperlanePlugin(
        {
            originChain: "ethereum",
            destinationChain: "optimism",
            rpcUrls: {
                ethereum: process.env.ORIGIN_CHAIN_RPC || "",
                optimism: process.env.DESTINATION_CHAIN_RPC || "",
            },
        },
        runtime
    );

    runtime.plugins.push(plugin);

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
