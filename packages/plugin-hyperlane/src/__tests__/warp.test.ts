import { IAgentRuntime, Memory, Plugin } from "@elizaos/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { warpActions } from "../actions/warp";

interface WarpTransferParams {
    amount: string;
    token: string;
    destination: string;
    warpRoute: string;
    recipient: string;
}

interface WarpTransferResult {
    id: string;
    status: string;
    hash: string;
}

interface WarpDeployParams {
    token: string;
    source: string;
    destination: string;
}

interface WarpDeployResult {
    address: string;
    status: string;
    hash: string;
}

interface MockHyperlanePlugin extends Plugin {
    name: string;
    description: string;
    core: {
        multiProvider: {
            getProvider: ReturnType<typeof vi.fn>;
        };
        warpService: {
            transfer: ReturnType<typeof vi.fn>;
            deployRoute: ReturnType<typeof vi.fn>;
        };
    };
}

describe("Warp Actions", () => {
    let mockRuntime: IAgentRuntime;
    const mockMessage: Memory = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        agentId: "123e4567-e89b-12d3-a456-426614174001",
        roomId: "123e4567-e89b-12d3-a456-426614174002",
        content: {
            text: "test message",
        },
    };

    beforeEach(() => {
        // Mock Contract class
        vi.mock("ethers", () => ({
            Contract: vi.fn().mockImplementation(() => ({
                decimals: vi.fn().mockResolvedValue(18),
                symbol: vi.fn().mockResolvedValue("TEST"),
            })),
            parseUnits: vi.fn().mockReturnValue("1000000000000000000"),
        }));

        const mockHyperlane: MockHyperlanePlugin = {
            name: "hyperlane",
            description: "Mock Hyperlane plugin for testing",
            core: {
                multiProvider: {
                    getProvider: vi.fn().mockReturnValue({}),
                },
                warpService: {
                    transfer: vi.fn().mockImplementation(async () => ({
                        id: "0x123",
                        status: "initiated",
                        hash: "0xabc",
                    })),
                    deployRoute: vi.fn().mockImplementation(async () => ({
                        address: "0x456",
                        status: "deployed",
                        hash: "0xdef",
                    })),
                },
            },
        };

        mockRuntime = {
            getSetting: vi.fn((key: string): string | null => {
                const settings: { [key: string]: string } = {
                    HYPERLANE_DEPLOYER_KEY: "0x1234567890abcdef",
                    HYPERLANE_VALIDATOR_KEY: "0xabcdef1234567890",
                    HYPERLANE_RELAYER_KEY: "0x9876543210fedcba",
                    ORIGIN_RPC: "https://eth-mainnet.example.com",
                    DESTINATION_RPC: "https://optimism.example.com",
                    ORIGIN_CHAIN_ID: "1",
                    DESTINATION_CHAIN_ID: "10",
                };
                return settings[key] || null;
            }),
            plugins: {
                hyperlane: mockHyperlane,
            },
        } as unknown as IAgentRuntime;
    });

    describe("Validation", () => {
        const transferAction = warpActions.find(
            (a) => a.name === "TRANSFER_VIA_WARP"
        )!;
        const deployAction = warpActions.find(
            (a) => a.name === "DEPLOY_WARP_ROUTE"
        )!;

        describe("TRANSFER_VIA_WARP validation", () => {
            it("should pass validation with all required settings", async () => {
                const result = await transferAction.validate(
                    mockRuntime,
                    mockMessage
                );
                expect(result).toBe(true);
            });

            it("should fail validation when relayer key is missing", async () => {
                vi.spyOn(mockRuntime, "getSetting").mockImplementation(
                    (key: string): string | null =>
                        key === "HYPERLANE_RELAYER_KEY" ? null : "0x1234"
                );
                const result = await transferAction.validate(
                    mockRuntime,
                    mockMessage
                );
                expect(result).toBe(false);
            });

            it("should fail validation when relayer key is invalid format", async () => {
                vi.spyOn(mockRuntime, "getSetting").mockImplementation(
                    (key: string): string | null =>
                        key === "HYPERLANE_RELAYER_KEY"
                            ? "invalid-key"
                            : "0x1234"
                );
                const result = await transferAction.validate(
                    mockRuntime,
                    mockMessage
                );
                expect(result).toBe(false);
            });
        });

        describe("DEPLOY_WARP_ROUTE validation", () => {
            it("should pass validation with all required settings", async () => {
                const result = await deployAction.validate(
                    mockRuntime,
                    mockMessage
                );
                expect(result).toBe(true);
            });

            it("should fail validation when validator key is missing", async () => {
                vi.spyOn(mockRuntime, "getSetting").mockImplementation(
                    (key: string): string | null =>
                        key === "HYPERLANE_VALIDATOR_KEY" ? null : "0x1234"
                );
                const result = await deployAction.validate(
                    mockRuntime,
                    mockMessage
                );
                expect(result).toBe(false);
            });

            it("should fail validation when validator key is invalid format", async () => {
                vi.spyOn(mockRuntime, "getSetting").mockImplementation(
                    (key: string): string | null =>
                        key === "HYPERLANE_VALIDATOR_KEY"
                            ? "invalid-key"
                            : "0x1234"
                );
                const result = await deployAction.validate(
                    mockRuntime,
                    mockMessage
                );
                expect(result).toBe(false);
            });
        });

        describe("Base Hyperlane config validation", () => {
            it("should fail validation when deployer key is missing", async () => {
                vi.spyOn(mockRuntime, "getSetting").mockImplementation(
                    (key: string): string | null =>
                        key === "HYPERLANE_DEPLOYER_KEY" ? null : "0x1234"
                );
                const result = await deployAction.validate(
                    mockRuntime,
                    mockMessage
                );
                expect(result).toBe(false);
            });

            it("should fail validation when RPCs are missing", async () => {
                vi.spyOn(mockRuntime, "getSetting").mockImplementation(
                    (key: string): string | null =>
                        key.includes("RPC") ? null : "0x1234"
                );
                const result = await deployAction.validate(
                    mockRuntime,
                    mockMessage
                );
                expect(result).toBe(false);
            });

            it("should fail validation when chain IDs are missing", async () => {
                vi.spyOn(mockRuntime, "getSetting").mockImplementation(
                    (key: string): string | null =>
                        key.includes("CHAIN_ID") ? null : "0x1234"
                );
                const result = await deployAction.validate(
                    mockRuntime,
                    mockMessage
                );
                expect(result).toBe(false);
            });
        });
    });

    describe("Handlers", () => {
        const transferAction = warpActions.find(
            (a) => a.name === "TRANSFER_VIA_WARP"
        )!;
        const deployAction = warpActions.find(
            (a) => a.name === "DEPLOY_WARP_ROUTE"
        )!;

        describe("TRANSFER_VIA_WARP handler", () => {
            it("should successfully transfer tokens", async () => {
                const transferMessage: Memory = {
                    ...mockMessage,
                    content: {
                        text: "Transfer 100 TEST to optimism",
                        amount: "100",
                        token: "0x1234567890123456789012345678901234567890",
                        destinationChain: "optimism",
                        warpRoute: "0x9876543210987654321098765432109876543210",
                        recipient: "0x5432109876543210987654321098765432109876",
                    },
                };

                const result = await transferAction.handler(
                    mockRuntime,
                    transferMessage
                );

                expect(result).toEqual({
                    transferId: "0x123",
                    status: "initiated",
                    details: expect.stringContaining(
                        "Transfer of 100 TEST initiated"
                    ),
                    txHash: "0xabc",
                });
            });
        });

        describe("DEPLOY_WARP_ROUTE handler", () => {
            it("should successfully deploy a warp route", async () => {
                const deployMessage: Memory = {
                    ...mockMessage,
                    content: {
                        text: "Deploy warp route for TEST token",
                        token: "0x1234567890123456789012345678901234567890",
                        sourceChain: "ethereum",
                        destinationChain: "optimism",
                    },
                };

                const result = await deployAction.handler(
                    mockRuntime,
                    deployMessage
                );

                expect(result).toEqual({
                    routeAddress: "0x456",
                    status: "deployed",
                    details: expect.stringContaining(
                        "Warp route deployed for TEST"
                    ),
                    txHash: "0xdef",
                });
            });
        });
    });
});
