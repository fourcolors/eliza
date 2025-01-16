/**
 * Actions for deploying Hyperlane infrastructure on new chains
 */
import { Action, IAgentRuntime, Memory } from "@elizaos/core";
import { ChainMap, ChainMetadata } from "@hyperlane-xyz/sdk";
import { ProtocolType } from "@hyperlane-xyz/utils";

export const deploymentActions: Action[] = [
    {
        name: "DEPLOY_HYPERLANE_CORE",
        description: "Deploy Hyperlane core contracts on a new chain",
        similes: ["deploy hyperlane", "setup new chain"],
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Deploy Hyperlane on chain 'avalanche' with RPC 'https://api.avax.network/ext/bc/C/rpc'",
                    },
                },
            ],
        ],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory) => {
            const params = message.content as unknown as {
                chainName: string;
                chainId: number;
                rpcUrl: string;
            };

            const hyperlane = (runtime.plugins as any).hyperlane;

            // Create chain metadata for the new chain
            const chainConfig: ChainMap<ChainMetadata> = {
                [params.chainName]: {
                    name: params.chainName,
                    protocol: ProtocolType.Ethereum,
                    chainId: params.chainId,
                    rpcUrls: [{ http: params.rpcUrl }],
                },
            };

            // Deploy core contracts
            const deployResult = await hyperlane.core.deployCore({
                chain: params.chainName,
                config: chainConfig,
            });

            return {
                chainName: params.chainName,
                status: "deployed",
                contracts: deployResult.addresses,
                details: `Hyperlane core contracts deployed on ${params.chainName}`,
            };
        },
    },
    {
        name: "DEPLOY_VALIDATOR_SET",
        description: "Deploy and configure a validator set for Hyperlane",
        similes: ["setup validators", "configure validator quorum"],
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Deploy validator set on chain 'avalanche' with threshold 2 and validators ['0x123', '0x456', '0x789']",
                    },
                },
            ],
        ],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory) => {
            const params = message.content as unknown as {
                chainName: string;
                validators: string[];
                threshold: number;
            };

            const hyperlane = (runtime.plugins as any).hyperlane;

            const validatorResult = await hyperlane.core.deployValidators({
                chain: params.chainName,
                validators: params.validators,
                threshold: params.threshold,
            });

            return {
                chainName: params.chainName,
                status: "deployed",
                validatorSet: validatorResult.address,
                details: `Validator set deployed with ${params.validators.length} validators and threshold ${params.threshold}`,
            };
        },
    },
    {
        name: "DEPLOY_RELAYER",
        description: "Deploy and configure a Hyperlane relayer",
        similes: ["setup relayer", "configure message relayer"],
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Deploy relayer for chain 'avalanche' with gas payment token '0x123'",
                    },
                },
            ],
        ],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory) => {
            const params = message.content as unknown as {
                chainName: string;
                gasPaymentToken: string;
            };

            const hyperlane = (runtime.plugins as any).hyperlane;

            const relayerResult = await hyperlane.core.deployRelayer({
                chain: params.chainName,
                gasPaymentToken: params.gasPaymentToken,
            });

            return {
                chainName: params.chainName,
                status: "deployed",
                relayerAddress: relayerResult.address,
                details: `Relayer deployed on ${params.chainName}`,
            };
        },
    },
];
