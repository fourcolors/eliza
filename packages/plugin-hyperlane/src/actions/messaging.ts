import { Action, IAgentRuntime, Memory } from "@elizaos/core";

export const messagingActions: Action[] = [
    {
        name: "SEND_CROSS_CHAIN_MESSAGE",
        description:
            "Send a message or function call to another chain via Hyperlane",
        similes: ["send hyperlane message", "dispatch cross chain message"],
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Send message to chain 'optimism' at address '0x123' with body 'hello' and gas 100000",
                    },
                },
            ],
        ],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory) => {
            const params = message.content as unknown as {
                destinationChain: string;
                destinationAddress: string;
                messageBody: string;
                gasAmount: number;
            };

            const hyperlane = (runtime.plugins as any).hyperlane;

            const messageResult =
                await hyperlane.core.messagingService.dispatch({
                    destination: params.destinationChain,
                    recipient: params.destinationAddress,
                    body: params.messageBody,
                    gasLimit: params.gasAmount,
                });

            return {
                messageId: messageResult.id,
                status: "dispatched",
                details: `Message sent to ${params.destinationChain}`,
            };
        },
    },
    {
        name: "CHECK_MESSAGE_STATUS",
        description: "Check the status of a cross-chain message",
        similes: ["check hyperlane message", "get message status"],
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Check status of message '0x123'",
                    },
                },
            ],
        ],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory) => {
            const params = message.content as unknown as { messageId: string };
            const hyperlane = (runtime.plugins as any).hyperlane;

            const status =
                await hyperlane.core.messagingService.getMessageStatus(
                    params.messageId
                );

            return {
                messageId: params.messageId,
                status,
                delivered: status === "DELIVERED",
            };
        },
    },
];
