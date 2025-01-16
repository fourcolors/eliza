import { IAgentRuntime, ServiceType } from "@elizaos/core";
import { MultiProvider } from "@hyperlane-xyz/sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getEnvironment } from "../environment";
import createHyperlanePlugin, { IHyperlaneService } from "../index";
import { HyperlaneConfig } from "../types";

// Create a mock core type that matches what we need to test
type MockHyperlaneCore = {
    connect: ReturnType<typeof vi.fn>;
    getMailbox: ReturnType<typeof vi.fn>;
    getInterchainGasPaymaster: ReturnType<typeof vi.fn>;
};

// Mock the dependencies
vi.mock("@hyperlane-xyz/sdk", () => ({
    HyperlaneCore: vi.fn().mockImplementation(
        (): MockHyperlaneCore => ({
            connect: vi.fn(),
            getMailbox: vi.fn(),
            getInterchainGasPaymaster: vi.fn(),
        })
    ),
    MultiProvider: vi.fn(),
}));

vi.mock("../environment", () => ({
    getEnvironment: vi.fn().mockReturnValue({
        HYPERLANE_DEPLOYER_KEY: "0x1234567890abcdef",
        HYPERLANE_VALIDATOR_KEY: "0xabcdef1234567890",
        HYPERLANE_RELAYER_KEY: "0x9876543210fedcba",
        ORIGIN_CHAIN: {
            name: "ethereum",
            chainId: 1,
            rpc: "https://mainnet.infura.io/v3/your-api-key",
        },
        DESTINATION_CHAIN: {
            name: "optimism",
            chainId: 10,
            rpc: "https://mainnet.optimism.io",
        },
        HYPERLANE_GAS_PAYMENT_ENFORCED: true,
        HYPERLANE_DEFAULT_GAS_LIMIT: 100000,
        HYPERLANE_TIMEOUT_SECONDS: 300,
    }),
}));

describe("HyperlaneService", () => {
    let mockRuntime: IAgentRuntime;
    let mockConfig: HyperlaneConfig;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Setup mock config
        mockConfig = {
            originChain: "ethereum",
            destinationChain: "optimism",
            rpcUrls: {
                ethereum: "https://mainnet.infura.io/v3/your-api-key",
                optimism: "https://mainnet.optimism.io",
            },
        };

        // Setup mock runtime
        mockRuntime = {
            getSetting: vi.fn((key: string): string | null => {
                const settings: { [key: string]: string } = {
                    HYPERLANE_DEPLOYER_KEY: "0x1234567890abcdef",
                    HYPERLANE_VALIDATOR_KEY: "0xabcdef1234567890",
                    HYPERLANE_RELAYER_KEY: "0x9876543210fedcba",
                };
                return settings[key] || null;
            }),
        } as unknown as IAgentRuntime;
    });

    describe("Service Creation", () => {
        it("should create a service with the correct type", async () => {
            const plugin = await createHyperlanePlugin(mockConfig, mockRuntime);
            const service = plugin.services?.[0] as IHyperlaneService;

            expect(service.serviceType).toBe(ServiceType.HYPERLANE);
        });

        it("should initialize with correct chain configuration", async () => {
            const plugin = await createHyperlanePlugin(mockConfig, mockRuntime);

            const env = getEnvironment();
            expect(MultiProvider).toHaveBeenCalledWith({
                [env.ORIGIN_CHAIN.name]: {
                    name: env.ORIGIN_CHAIN.name,
                    protocol: 1, // ProtocolType.Ethereum
                    chainId: env.ORIGIN_CHAIN.chainId,
                    rpcUrls: [{ http: env.ORIGIN_CHAIN.rpc }],
                },
                [env.DESTINATION_CHAIN.name]: {
                    name: env.DESTINATION_CHAIN.name,
                    protocol: 1, // ProtocolType.Ethereum
                    chainId: env.DESTINATION_CHAIN.chainId,
                    rpcUrls: [{ http: env.DESTINATION_CHAIN.rpc }],
                },
            });
        });
    });

    describe("Service State", () => {
        it("should provide access to core after initialization", async () => {
            const plugin = await createHyperlanePlugin(mockConfig, mockRuntime);
            const service = plugin.services?.[0] as IHyperlaneService;

            const core = service.getCore() as unknown as MockHyperlaneCore;
            expect(core).toBeDefined();
            expect(typeof core.connect).toBe("function");
            expect(typeof core.getMailbox).toBe("function");
            expect(typeof core.getInterchainGasPaymaster).toBe("function");
        });

        it("should provide access to providers after initialization", async () => {
            const plugin = await createHyperlanePlugin(mockConfig, mockRuntime);
            const service = plugin.services?.[0] as IHyperlaneService;

            const providers = service.getProviders();
            expect(providers).toBeDefined();
            expect(Array.isArray(providers)).toBe(true);
            expect(providers.length).toBeGreaterThan(0);
        });
    });

    describe("Error Handling", () => {
        it("should handle initialization errors gracefully", async () => {
            (
                MultiProvider as unknown as ReturnType<typeof vi.fn>
            ).mockImplementation(() => {
                throw new Error("Provider initialization failed");
            });

            await expect(
                createHyperlanePlugin(mockConfig, mockRuntime)
            ).rejects.toThrow("Provider initialization failed");
        });

        it("should handle missing environment variables", async () => {
            vi.mocked(getEnvironment).mockImplementation(() => {
                throw new Error(
                    "Required environment variable ORIGIN_CHAIN_RPC is not set"
                );
            });

            await expect(
                createHyperlanePlugin(mockConfig, mockRuntime)
            ).rejects.toThrow(
                "Required environment variable ORIGIN_CHAIN_RPC is not set"
            );
        });
    });
});
