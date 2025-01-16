import { vi } from "vitest";

vi.mock("@hyperlane-xyz/sdk", () => ({
    HyperlaneCore: vi.fn(),
    MultiProvider: vi.fn(),
}));

vi.mock("@hyperlane-xyz/utils", () => ({
    ProtocolType: {
        Ethereum: 1,
    },
}));

vi.mock("../environment", () => ({
    getEnvironment: vi.fn().mockReturnValue({
        HYPERLANE_DEPLOYER_KEY: "0x" + "1".repeat(64),
        HYPERLANE_VALIDATOR_KEY: "0x" + "2".repeat(64),
        HYPERLANE_RELAYER_KEY: "0x" + "3".repeat(64),
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
