import type { IAgentRuntime } from "@elizaos/core";
import { ServiceType } from "@elizaos/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGasProvider } from "../../providers/createGasProvider";
import { createManageTransactionAction } from "../manageTransaction";

vi.mock("../../providers/createGasProvider");

describe("manageTransaction action", () => {
    const mockTxResponse = {
        hash: "0x123abc",
        wait: vi.fn(),
    };

    const mockReceipt = {
        hash: "0x123abc",
        status: 1,
        blockNumber: 12345678,
        gasUsed: BigInt("21000"),
        effectiveGasPrice: BigInt("1000000000"),
    };
    const mockFeeData = {
        maxFeePerGas: BigInt("2000000000"),
        maxPriorityFeePerGas: BigInt("1000000000"),
        lastBaseFeePerGas: BigInt("1000000000"),
    };

    const mockProvider = {
        sendTransaction: vi.fn(),
        getTransactionReceipt: vi.fn(),
        estimateGas: vi.fn(),
        getFeeData: vi.fn(),
        getBlock: vi.fn(),
    };

    const mockGasProvider = {
        estimateGas: vi.fn(),
    };

    const mockHyperlane = {
        getProvider: vi.fn(),
        getMailbox: vi.fn(),
    };

    const createMockRuntime = () =>
        ({
            services: {
                get: vi.fn(),
            },
        }) as unknown as IAgentRuntime;

    beforeEach(() => {
        vi.resetAllMocks();
        mockTxResponse.wait.mockResolvedValue(mockReceipt);
        mockProvider.sendTransaction.mockResolvedValue(mockTxResponse);
        mockProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);
        mockProvider.estimateGas.mockResolvedValue(BigInt("21000"));
        mockProvider.getFeeData.mockResolvedValue(mockFeeData);
        mockProvider.getBlock.mockResolvedValue({
            gasLimit: BigInt("2000000"),
        });
        mockHyperlane.getProvider.mockResolvedValue(mockProvider);
        mockGasProvider.estimateGas.mockResolvedValue({
            gasLimit: BigInt("21000"),
            maxFeePerGas: BigInt("2000000000"),
            maxPriorityFeePerGas: BigInt("1000000000"),
        });
        (createGasProvider as any).mockReturnValue(mockGasProvider);
    });

    it("should submit transaction successfully", async () => {
        const mockRuntime = createMockRuntime();
        mockRuntime.services.get.mockResolvedValue(mockHyperlane);

        const action = createManageTransactionAction();
        const result = await action.handler(mockRuntime, {
            content: {
                input: {
                    chainId: "1",
                    operation: "submit",
                    to: "0x123abc",
                    data: "0x456def",
                    value: "0x0",
                },
            },
        });

        expect(mockRuntime.services.get).toHaveBeenCalledWith(
            ServiceType.HYPERLANE
        );
        expect(mockHyperlane.getProvider).toHaveBeenCalledWith("1");
        expect(mockGasProvider.estimateGas).toHaveBeenCalledWith({
            to: "0x123abc",
            data: "0x456def",
            value: BigInt("0"),
            chainId: "1",
        });

        expect(mockProvider.sendTransaction).toHaveBeenCalledWith({
            to: "0x123abc",
            data: "0x456def",
            value: BigInt("0"),
            maxFeePerGas: BigInt("2000000000"),
            maxPriorityFeePerGas: BigInt("1000000000"),
            gasLimit: BigInt("21000"),
        });

        expect(result.success).toBe(true);
        expect(result.data?.transaction).toEqual({
            hash: "0x123abc",
            status: "confirmed",
            blockNumber: 12345678,
            gasUsed: "21000",
            effectiveGasPrice: "1000000000",
        });
    });

    it("should check transaction status successfully", async () => {
        const mockRuntime = createMockRuntime();
        mockRuntime.services.get.mockResolvedValue(mockHyperlane);

        const action = createManageTransactionAction();
        const result = await action.handler(mockRuntime, {
            content: {
                input: {
                    chainId: "1",
                    operation: "status",
                    txHash: "0x123abc",
                },
            },
        });

        expect(mockProvider.getTransactionReceipt).toHaveBeenCalledWith(
            "0x123abc"
        );
        expect(result.success).toBe(true);
        expect(result.data?.transaction).toEqual({
            hash: "0x123abc",
            status: "confirmed",
            blockNumber: 12345678,
            gasUsed: "21000",
            effectiveGasPrice: "1000000000",
        });
    });

    it("should handle pending transaction status", async () => {
        const mockRuntime = createMockRuntime();
        mockRuntime.services.get.mockResolvedValue(mockHyperlane);
        mockProvider.getTransactionReceipt.mockResolvedValue(null);

        const action = createManageTransactionAction();
        const result = await action.handler(mockRuntime, {
            content: {
                input: {
                    chainId: "1",
                    operation: "status",
                    txHash: "0x123abc",
                },
            },
        });

        expect(result.success).toBe(true);
        expect(result.data?.transaction).toEqual({
            hash: "0x123abc",
            status: "pending",
        });
    });

    it("should estimate gas successfully", async () => {
        const mockRuntime = createMockRuntime();
        mockRuntime.services.get.mockResolvedValue(mockHyperlane);

        const action = createManageTransactionAction();
        const result = await action.handler(mockRuntime, {
            content: {
                input: {
                    chainId: "1",
                    operation: "estimate",
                    to: "0x123abc",
                    data: "0x456def",
                },
            },
        });

        expect(mockGasProvider.estimateGas).toHaveBeenCalledWith({
            to: "0x123abc",
            data: "0x456def",
            value: BigInt("0"),
            chainId: "1",
        });

        expect(result.success).toBe(true);
        expect(result.data?.estimate).toEqual({
            gasLimit: "21000",
            maxFeePerGas: "2000000000",
            maxPriorityFeePerGas: "1000000000",
        });
    });

    it("should handle invalid chain ID", async () => {
        const mockRuntime = createMockRuntime();
        mockRuntime.services.get.mockResolvedValue(mockHyperlane);
        mockHyperlane.getProvider.mockResolvedValue(null);

        const action = createManageTransactionAction();
        const result = await action.handler(mockRuntime, {
            content: {
                input: {
                    chainId: "999",
                    operation: "status",
                    txHash: "0x123abc",
                },
            },
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Chain 999 not found");
    });

    it("should handle transaction submission failure", async () => {
        const mockRuntime = createMockRuntime();
        mockRuntime.services.get.mockResolvedValue(mockHyperlane);
        mockProvider.sendTransaction.mockRejectedValue(
            new Error("insufficient funds for gas * price + value")
        );

        const action = createManageTransactionAction();
        const result = await action.handler(mockRuntime, {
            content: {
                input: {
                    chainId: "1",
                    operation: "submit",
                    to: "0x123abc",
                    data: "0x456def",
                },
            },
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe(
            "Transaction error: Insufficient funds for transaction"
        );
    });

    it("should validate input correctly", async () => {
        const mockRuntime = createMockRuntime();
        const action = createManageTransactionAction();

        const validSubmitResult = await action.validate(mockRuntime, {
            content: {
                input: {
                    chainId: "1",
                    operation: "submit",
                    to: "0x123abc",
                    data: "0x456def",
                },
            },
        });

        const validStatusResult = await action.validate(mockRuntime, {
            content: {
                input: {
                    chainId: "1",
                    operation: "status",
                    txHash: "0x123abc",
                },
            },
        });

        const invalidChainResult = await action.validate(mockRuntime, {
            content: {
                input: {
                    chainId: "invalid",
                    operation: "status",
                    txHash: "0x123abc",
                },
            },
        });

        const invalidOperationResult = await action.validate(mockRuntime, {
            content: {
                input: {
                    chainId: "1",
                    operation: "invalid",
                    txHash: "0x123abc",
                },
            },
        });

        expect(validSubmitResult).toBe(true);
        expect(validStatusResult).toBe(true);
        expect(invalidChainResult).toBe(false);
        expect(invalidOperationResult).toBe(false);
    });

    it("should handle malformed hex input", async () => {
        const mockRuntime = createMockRuntime();
        mockRuntime.services.get.mockResolvedValue(mockHyperlane);

        const action = createManageTransactionAction();
        const result = await action.validate(mockRuntime, {
            content: {
                input: {
                    chainId: "1",
                    operation: "submit",
                    to: "123abc", // Missing 0x prefix
                    data: "0x456def",
                },
            },
        });

        expect(result).toBe(false);
    });

    it("should reject oversized hex input", async () => {
        const mockRuntime = createMockRuntime();
        const action = createManageTransactionAction();

        const result = await action.validate(mockRuntime, {
            content: {
                input: {
                    chainId: "1",
                    operation: "submit",
                    to: "0x" + "a".repeat(41), // Too long for address
                    data: "0x" + "b".repeat(4096), // Too long for data
                },
            },
        });

        expect(result).toBe(false);
    });

    it("should handle operation timeouts", async () => {
        vi.useFakeTimers();
        const mockRuntime = createMockRuntime();
        mockRuntime.services.get.mockResolvedValue(mockHyperlane);

        mockGasProvider.estimateGas.mockImplementation(
            () =>
                new Promise((resolve) => {
                    setTimeout(resolve, 31 * 1000); // Longer than the 30s timeout
                })
        );

        const action = createManageTransactionAction();
        const resultPromise = action.handler(mockRuntime, {
            content: {
                input: {
                    chainId: "1",
                    operation: "submit",
                    to: "0x123abc",
                    data: "0x456def",
                },
            },
        });

        await vi.advanceTimersByTimeAsync(31 * 1000);
        const result = await resultPromise;

        expect(result.success).toBe(false);
        expect(result.error).toContain("Operation timed out");
        vi.useRealTimers();
    });

    it("should handle specific transaction errors", async () => {
        const mockRuntime = createMockRuntime();
        mockRuntime.services.get.mockResolvedValue(mockHyperlane);

        mockGasProvider.estimateGas.mockResolvedValue({
            gasLimit: BigInt("21000"),
            maxFeePerGas: BigInt("2000000000"),
            maxPriorityFeePerGas: BigInt("1000000000"),
        });

        mockProvider.sendTransaction.mockRejectedValue(
            new Error("insufficient funds for gas * price + value")
        );

        const action = createManageTransactionAction();
        const result = await action.handler(mockRuntime, {
            content: {
                input: {
                    chainId: "1",
                    operation: "submit",
                    to: "0x123abc",
                    data: "0x456def",
                },
            },
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe(
            "Transaction error: Insufficient funds for transaction"
        );
    });
});
