/**
 * /packages/plugin-hyperlane/src/core/validations/__tests__/validateChainSupport.test.ts
 *
 * Tests for the validateChainSupport function which validates whether a chain is supported
 * by the Hyperlane protocol. The tests cover various scenarios including:
 * - Missing chain metadata
 * - Missing RPC endpoints
 * - AbacusWorks permission requirements
 * - Valid chain configurations
 */

import { isAbacusWorksChain } from "@hyperlane-xyz/registry";
import { ChainMetadata, ChainName, MultiProvider } from "@hyperlane-xyz/sdk";
import { ProtocolType } from "@hyperlane-xyz/utils";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    MockInstance,
    vi,
} from "vitest";
import {
    ChainValidationResult,
    validateChainSupport,
} from "../validateChainSupport";

vi.mock("@hyperlane-xyz/registry", () => ({
    isAbacusWorksChain: vi.fn(),
}));

describe("validateChainSupport", () => {
    const mockChainId = "test-chain-1" as ChainName;
    let mockMultiProvider: {
        tryGetChainMetadata: MockInstance<[ChainName], ChainMetadata | null>;
        tryGetProtocol: MockInstance<[ChainName], ProtocolType>;
    };

    const createMockChainMetadata = (
        overrides: Partial<ChainMetadata> = {}
    ): ChainMetadata => ({
        name: "Test Chain",
        displayName: "Test Chain Display",
        chainId: 1234,
        domainId: 1234,
        protocol: "ethereum" as ProtocolType,
        rpcUrls: [
            {
                http: "https://example.com",
            },
        ],
        blockExplorers: [],
        blocks: {
            confirmations: 1,
            reorgPeriod: 0,
            estimateBlockTime: 10,
        },
        nativeToken: {
            name: "Test Token",
            symbol: "TEST",
            decimals: 18,
        },
        ...overrides,
    });

    beforeEach(() => {
        mockMultiProvider = {
            tryGetChainMetadata: vi.fn(),
            tryGetProtocol: vi.fn(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("returns unsupported when chain metadata not found", () => {
        mockMultiProvider.tryGetChainMetadata.mockReturnValue(null);

        const result = validateChainSupport(
            mockMultiProvider as unknown as MultiProvider,
            mockChainId
        );

        expect(result.isSupported).toBe(false);
        expect(result.errors).toEqual([
            "Chain not found in Hyperlane registry",
        ]);
        expect(result.metadata).toBeUndefined();
    });

    describe("chain support validation", () => {
        interface TestCase {
            name: string;
            metadata: ChainMetadata;
            isAbacusWorks: boolean;
            protocol: ProtocolType;
            expectedResult: ChainValidationResult;
        }

        const testCases: TestCase[] = [
            {
                name: "returns unsupported when chain has no RPC endpoints",
                metadata: createMockChainMetadata({ rpcUrls: [] }),
                isAbacusWorks: false,
                protocol: "ethereum" as ProtocolType,
                expectedResult: {
                    isSupported: false,
                    errors: ["Chain has no RPC endpoints configured"],
                    metadata: {
                        name: "Test Chain",
                        displayName: "Test Chain Display",
                        protocol: "ethereum",
                    },
                },
            },
            {
                name: "returns unsupported when chain requires AbacusWorks",
                metadata: createMockChainMetadata(),
                isAbacusWorks: true,
                protocol: "ethereum" as ProtocolType,
                expectedResult: {
                    isSupported: false,
                    errors: ["Chain requires Abacus Works permissions"],
                    metadata: {
                        name: "Test Chain",
                        displayName: "Test Chain Display",
                        protocol: "ethereum",
                    },
                },
            },
            {
                name: "returns supported for valid chain with RPC endpoints",
                metadata: createMockChainMetadata(),
                isAbacusWorks: false,
                protocol: "ethereum" as ProtocolType,
                expectedResult: {
                    isSupported: true,
                    errors: [],
                    metadata: {
                        name: "Test Chain",
                        displayName: "Test Chain Display",
                        protocol: "ethereum",
                    },
                },
            },
            {
                name: "handles chain without display name",
                metadata: createMockChainMetadata({ displayName: undefined }),
                isAbacusWorks: false,
                protocol: "ethereum" as ProtocolType,
                expectedResult: {
                    isSupported: true,
                    errors: [],
                    metadata: {
                        name: "Test Chain",
                        displayName: "Test Chain",
                        protocol: "ethereum",
                    },
                },
            },
        ];

        testCases.forEach(
            ({ name, metadata, isAbacusWorks, protocol, expectedResult }) => {
                it(name, () => {
                    mockMultiProvider.tryGetChainMetadata.mockReturnValue(
                        metadata
                    );
                    mockMultiProvider.tryGetProtocol.mockReturnValue(protocol);
                    vi.mocked(isAbacusWorksChain).mockReturnValue(
                        isAbacusWorks
                    );

                    const result = validateChainSupport(
                        mockMultiProvider as unknown as MultiProvider,
                        mockChainId
                    );

                    expect(result).toEqual(expectedResult);
                });
            }
        );
    });
});
