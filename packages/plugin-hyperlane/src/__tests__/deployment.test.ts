import { Memory } from "@elizaos/core";
import { jest } from "@jest/globals";
import { deploymentActions } from "../actions/deployment";

// Mock the ProtocolType enum
const ProtocolType = {
    Ethereum: 1,
} as const;

describe("Deployment Actions", () => {
    const mockRuntime = {
        plugins: {
            hyperlane: {
                core: {
                    deployCore: jest.fn() as jest.Mock<any>,
                    deployValidators: jest.fn() as jest.Mock<any>,
                    deployRelayer: jest.fn() as jest.Mock<any>,
                },
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockRuntime.plugins.hyperlane.core.deployCore.mockResolvedValue({
            addresses: {
                mailbox: "0x123",
                interchainGasPaymaster: "0x456",
            },
        });
        mockRuntime.plugins.hyperlane.core.deployValidators.mockResolvedValue({
            address: "0x789",
        });
        mockRuntime.plugins.hyperlane.core.deployRelayer.mockResolvedValue({
            address: "0xabc",
        });
    });

    describe("DEPLOY_HYPERLANE_CORE", () => {
        const deployCore = deploymentActions.find(
            (action) => action.name === "DEPLOY_HYPERLANE_CORE"
        );

        it("should deploy core contracts", async () => {
            const message: Memory = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                agentId: "123e4567-e89b-12d3-a456-426614174001",
                roomId: "123e4567-e89b-12d3-a456-426614174002",
                content: {
                    text: "Deploy Hyperlane on chain 'avalanche' with RPC 'https://api.avax.network/ext/bc/C/rpc'",
                    chainName: "avalanche",
                    chainId: 43114,
                    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
                },
            };

            const result = await deployCore!.handler(
                mockRuntime as any,
                message
            );

            expect(
                mockRuntime.plugins.hyperlane.core.deployCore
            ).toHaveBeenCalledWith({
                chain: "avalanche",
                config: {
                    avalanche: {
                        name: "avalanche",
                        protocol: ProtocolType.Ethereum,
                        chainId: 43114,
                        rpcUrls: [
                            { http: "https://api.avax.network/ext/bc/C/rpc" },
                        ],
                    },
                },
            });

            expect(result).toEqual({
                chainName: "avalanche",
                status: "deployed",
                contracts: {
                    mailbox: "0x123",
                    interchainGasPaymaster: "0x456",
                },
                details: "Hyperlane core contracts deployed on avalanche",
            });
        });

        it("should handle core deployment errors", async () => {
            mockRuntime.plugins.hyperlane.core.deployCore.mockRejectedValueOnce(
                new Error("Deployment failed")
            );

            const message: Memory = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                agentId: "123e4567-e89b-12d3-a456-426614174001",
                roomId: "123e4567-e89b-12d3-a456-426614174002",
                content: {
                    text: "Deploy Hyperlane on chain 'avalanche' with RPC 'https://api.avax.network/ext/bc/C/rpc'",
                    chainName: "avalanche",
                    chainId: 43114,
                    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
                },
            };

            await expect(
                deployCore!.handler(mockRuntime as any, message)
            ).rejects.toThrow("Deployment failed");
        });
    });

    describe("DEPLOY_VALIDATOR_SET", () => {
        const deployValidators = deploymentActions.find(
            (action) => action.name === "DEPLOY_VALIDATOR_SET"
        );

        it("should deploy validator set", async () => {
            const message: Memory = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                agentId: "123e4567-e89b-12d3-a456-426614174001",
                roomId: "123e4567-e89b-12d3-a456-426614174002",
                content: {
                    text: "Deploy validator set on chain 'avalanche' with threshold 2 and validators ['0x123', '0x456', '0x789']",
                    chainName: "avalanche",
                    validators: ["0x123", "0x456", "0x789"],
                    threshold: 2,
                },
            };

            const result = await deployValidators!.handler(
                mockRuntime as any,
                message
            );

            expect(
                mockRuntime.plugins.hyperlane.core.deployValidators
            ).toHaveBeenCalledWith({
                chain: "avalanche",
                validators: ["0x123", "0x456", "0x789"],
                threshold: 2,
            });

            expect(result).toEqual({
                chainName: "avalanche",
                status: "deployed",
                validatorSet: "0x789",
                details:
                    "Validator set deployed with 3 validators and threshold 2",
            });
        });

        it("should handle validator deployment errors", async () => {
            mockRuntime.plugins.hyperlane.core.deployValidators.mockRejectedValueOnce(
                new Error("Deployment failed")
            );

            const message: Memory = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                agentId: "123e4567-e89b-12d3-a456-426614174001",
                roomId: "123e4567-e89b-12d3-a456-426614174002",
                content: {
                    text: "Deploy validator set on chain 'avalanche' with threshold 2 and validators ['0x123', '0x456', '0x789']",
                    chainName: "avalanche",
                    validators: ["0x123", "0x456", "0x789"],
                    threshold: 2,
                },
            };

            await expect(
                deployValidators!.handler(mockRuntime as any, message)
            ).rejects.toThrow("Deployment failed");
        });
    });

    describe("DEPLOY_RELAYER", () => {
        const deployRelayer = deploymentActions.find(
            (action) => action.name === "DEPLOY_RELAYER"
        );

        it("should deploy relayer", async () => {
            const message: Memory = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                agentId: "123e4567-e89b-12d3-a456-426614174001",
                roomId: "123e4567-e89b-12d3-a456-426614174002",
                content: {
                    text: "Deploy relayer for chain 'avalanche' with gas payment token '0x123'",
                    chainName: "avalanche",
                    gasPaymentToken: "0x123",
                },
            };

            const result = await deployRelayer!.handler(
                mockRuntime as any,
                message
            );

            expect(
                mockRuntime.plugins.hyperlane.core.deployRelayer
            ).toHaveBeenCalledWith({
                chain: "avalanche",
                gasPaymentToken: "0x123",
            });

            expect(result).toEqual({
                chainName: "avalanche",
                status: "deployed",
                relayerAddress: "0xabc",
                details: "Relayer deployed on avalanche",
            });
        });

        it("should handle relayer deployment errors", async () => {
            mockRuntime.plugins.hyperlane.core.deployRelayer.mockRejectedValueOnce(
                new Error("Deployment failed")
            );

            const message: Memory = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                agentId: "123e4567-e89b-12d3-a456-426614174001",
                roomId: "123e4567-e89b-12d3-a456-426614174002",
                content: {
                    text: "Deploy relayer for chain 'avalanche' with gas payment token '0x123'",
                    chainName: "avalanche",
                    gasPaymentToken: "0x123",
                },
            };

            await expect(
                deployRelayer!.handler(mockRuntime as any, message)
            ).rejects.toThrow("Deployment failed");
        });
    });
});
