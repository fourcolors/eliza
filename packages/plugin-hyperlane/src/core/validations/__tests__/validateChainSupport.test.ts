/**
 * /packages/plugin-hyperlane/src/core/validations/__tests__/validateChainSupport.test.ts
 *
 * Tests for the validateChainSupport function which validates whether a chain is supported
 * by the Hyperlane protocol. The tests cover various scenarios including:
 * - Missing chain metadata
 * - Missing RPC endpoints
 * - Valid chain configurations
 */

import { ChainMetadata, ChainName, MultiProtocolProvider } from "@hyperlane-xyz/sdk";
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

describe("validateChainSupport", () => {
    const mockChainName = "test-chain" as ChainName;
    let mockMultiProvider: MultiProtocolProvider;
    let mockGetMetadata: MockInstance<[ChainName], ChainMetadata | null>;
    let mockGetProtocol: MockInstance<[ChainName], ProtocolType>;

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
        mockGetMetadata = vi.fn();
        mockGetProtocol = vi.fn();
        mockMultiProvider = {
            tryGetChainMetadata: mockGetMetadata,
            tryGetProtocol: mockGetProtocol
        } as unknown as MultiProtocolProvider;
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it("returns unsupported when chain metadata is not found", () => {
        mockGetMetadata.mockReturnValue(null);

        const result = validateChainSupport(
            mockMultiProvider,
            mockChainName
        );

        expect(result).toEqual({
            isSupported: false,
            errors: ["Chain not found in Hyperlane registry"],
        });
    });

    describe("chain support validation", () => {
        interface TestCase {
            name: string;
            metadata: ChainMetadata;
            protocol: ProtocolType;
            expectedResult: ChainValidationResult;
        }

        const testCases: TestCase[] = [
            {
                name: "returns unsupported when chain has no RPC endpoints",
                metadata: createMockChainMetadata({ rpcUrls: [] }),
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
                name: "returns supported for valid chain with RPC endpoints",
                metadata: createMockChainMetadata(),
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

        testCases.forEach(({ name, metadata, protocol, expectedResult }) => {
            it(name, () => {
                mockGetMetadata.mockReturnValue(metadata);
                mockGetProtocol.mockReturnValue(protocol);

                const result = validateChainSupport(
                    mockMultiProvider,
                    mockChainName
                );

                expect(result).toEqual(expectedResult);
            });
        });
    });
});
