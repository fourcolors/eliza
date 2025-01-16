/**
 * Actions for managing Hyperlane Warp Routes and asset transfers
 */
import { Action, IAgentRuntime, Memory } from "@elizaos/core";
import { parseUnits } from "ethers/lib/utils";

export const warpActions: Action[] = [
    {
        name: "TRANSFER_VIA_WARP",
        description: "Transfer assets using Hyperlane Warp Routes",
        similes: ["transfer tokens", "send assets cross-chain"],
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Transfer 100 USDC to optimism using warp route 0x123",
                    },
                },
            ],
        ],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory) => {
            const params = message.content as unknown as {
                amount: string;
                token: string;
                destinationChain: string;
                warpRoute: string;
                recipient: string;
            };

            const hyperlane = (runtime.plugins as any).hyperlane;

            const transferResult = await hyperlane.core.warpService.transfer({
                amount: parseUnits(params.amount, 18),
                token: params.token,
                destination: params.destinationChain,
                warpRoute: params.warpRoute,
                recipient: params.recipient,
            });

            return {
                transferId: transferResult.id,
                status: "initiated",
                details: `Transfer of ${params.amount} ${params.token} initiated to ${params.destinationChain}`,
            };
        },
    },
    {
        name: "DEPLOY_WARP_ROUTE",
        description: "Deploy a new Warp Route for asset transfers",
        similes: ["create warp route", "setup token bridge"],
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Deploy warp route for USDC between ethereum and optimism",
                    },
                },
            ],
        ],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory) => {
            const params = message.content as unknown as {
                token: string;
                sourceChain: string;
                destinationChain: string;
            };

            const hyperlane = (runtime.plugins as any).hyperlane;

            const deployResult = await hyperlane.core.warpService.deployRoute({
                token: params.token,
                source: params.sourceChain,
                destination: params.destinationChain,
            });

            return {
                routeAddress: deployResult.address,
                status: "deployed",
                details: `Warp route deployed for ${params.token} between ${params.sourceChain} and ${params.destinationChain}`,
            };
        },
    },
];
