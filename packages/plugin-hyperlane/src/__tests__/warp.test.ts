import { Memory } from "@elizaos/core";
import { jest } from "@jest/globals";
import { parseUnits } from "ethers/lib/utils";
import { warpActions } from "../actions/warp";

describe("Warp Route Actions", () => {
    const mockRuntime = {
        plugins: {
            hyperlane: {
                core: {
                    warpService: {
                        transfer: jest.fn() as jest.Mock<any>,
                        deployRoute: jest.fn() as jest.Mock<any>,
                    },
                },
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockRuntime.plugins.hyperlane.core.warpService.transfer.mockResolvedValue(
            {
                id: "0x123",
                status: "initiated",
            }
        );
        mockRuntime.plugins.hyperlane.core.warpService.deployRoute.mockResolvedValue(
            {
                address: "0x456",
                status: "deployed",
            }
        );
    });

    describe("TRANSFER_VIA_WARP", () => {
        const transferAction = warpActions.find(
            (action) => action.name === "TRANSFER_VIA_WARP"
        );

        it("should transfer tokens via warp route", async () => {
            const message: Memory = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                agentId: "123e4567-e89b-12d3-a456-426614174001",
                roomId: "123e4567-e89b-12d3-a456-426614174002",
                content: {
                    text: "Transfer 100 USDC to optimism using warp route 0x123",
                    amount: "100",
                    token: "0xUSDC",
                    destinationChain: "optimism",
                    warpRoute: "0x123",
                    recipient: "0x789",
                },
            };

            const result = await transferAction!.handler(
                mockRuntime as any,
                message
            );

            expect(
                mockRuntime.plugins.hyperlane.core.warpService.transfer
            ).toHaveBeenCalledWith({
                amount: parseUnits("100", 18),
                token: "0xUSDC",
                destination: "optimism",
                warpRoute: "0x123",
                recipient: "0x789",
            });

            expect(result).toEqual({
                transferId: "0x123",
                status: "initiated",
                details: "Transfer of 100 0xUSDC initiated to optimism",
            });
        });

        it("should handle transfer errors", async () => {
            mockRuntime.plugins.hyperlane.core.warpService.transfer.mockRejectedValueOnce(
                new Error("Transfer failed")
            );

            const message: Memory = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                agentId: "123e4567-e89b-12d3-a456-426614174001",
                roomId: "123e4567-e89b-12d3-a456-426614174002",
                content: {
                    text: "Transfer 100 USDC to optimism using warp route 0x123",
                    amount: "100",
                    token: "0xUSDC",
                    destinationChain: "optimism",
                    warpRoute: "0x123",
                    recipient: "0x789",
                },
            };

            await expect(
                transferAction!.handler(mockRuntime as any, message)
            ).rejects.toThrow("Transfer failed");
        });
    });

    describe("DEPLOY_WARP_ROUTE", () => {
        const deployAction = warpActions.find(
            (action) => action.name === "DEPLOY_WARP_ROUTE"
        );

        it("should deploy a new warp route", async () => {
            const message: Memory = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                agentId: "123e4567-e89b-12d3-a456-426614174001",
                roomId: "123e4567-e89b-12d3-a456-426614174002",
                content: {
                    text: "Deploy warp route for USDC between ethereum and optimism",
                    token: "0xUSDC",
                    sourceChain: "ethereum",
                    destinationChain: "optimism",
                },
            };

            const result = await deployAction!.handler(
                mockRuntime as any,
                message
            );

            expect(
                mockRuntime.plugins.hyperlane.core.warpService.deployRoute
            ).toHaveBeenCalledWith({
                token: "0xUSDC",
                source: "ethereum",
                destination: "optimism",
            });

            expect(result).toEqual({
                routeAddress: "0x456",
                status: "deployed",
                details:
                    "Warp route deployed for 0xUSDC between ethereum and optimism",
            });
        });

        it("should handle deployment errors", async () => {
            mockRuntime.plugins.hyperlane.core.warpService.deployRoute.mockRejectedValueOnce(
                new Error("Deployment failed")
            );

            const message: Memory = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                agentId: "123e4567-e89b-12d3-a456-426614174001",
                roomId: "123e4567-e89b-12d3-a456-426614174002",
                content: {
                    text: "Deploy warp route for USDC between ethereum and optimism",
                    token: "0xUSDC",
                    sourceChain: "ethereum",
                    destinationChain: "optimism",
                },
            };

            await expect(
                deployAction!.handler(mockRuntime as any, message)
            ).rejects.toThrow("Deployment failed");
        });
    });
});
