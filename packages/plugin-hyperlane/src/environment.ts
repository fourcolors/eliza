import { z } from "zod";

const ChainConfigSchema = z.object({
    rpc: z.string().url(),
    chainId: z.number(),
    name: z.string(),
});

export const HyperlaneEnvironmentSchema = z.object({
    HYPERLANE_DEPLOYER_KEY: z
        .string()
        .min(64)
        .max(66)
        .regex(/^0x[a-fA-F0-9]{64}$/)
        .describe("Private key for deploying Hyperlane contracts"),

    HYPERLANE_VALIDATOR_KEY: z
        .string()
        .min(64)
        .max(66)
        .regex(/^0x[a-fA-F0-9]{64}$/)
        .describe("Private key for validator operations"),

    HYPERLANE_RELAYER_KEY: z
        .string()
        .min(64)
        .max(66)
        .regex(/^0x[a-fA-F0-9]{64}$/)
        .describe("Private key for relayer operations"),

    ORIGIN_CHAIN: ChainConfigSchema,
    DESTINATION_CHAIN: ChainConfigSchema,

    HYPERLANE_GAS_PAYMENT_ENFORCED: z.coerce
        .boolean()
        .default(true)
        .describe("Whether to enforce gas payments for message delivery"),

    HYPERLANE_DEFAULT_GAS_LIMIT: z.coerce
        .number()
        .int()
        .positive()
        .default(100000)
        .describe("Default gas limit for cross-chain messages"),

    HYPERLANE_TIMEOUT_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(300)
        .describe("Timeout in seconds for cross-chain operations"),
});

export type HyperlaneEnvironment = z.infer<typeof HyperlaneEnvironmentSchema>;

function parseChainConfig(prefix: string): z.infer<typeof ChainConfigSchema> {
    const rpc = process.env[`${prefix}_RPC`];
    const chainId = process.env[`${prefix}_CHAIN_ID`];
    const name = process.env[`${prefix}_NAME`];

    if (!rpc) {
        throw new Error(`Missing required environment variable ${prefix}_RPC`);
    }
    if (!chainId) {
        throw new Error(
            `Missing required environment variable ${prefix}_CHAIN_ID`
        );
    }
    if (!name) {
        throw new Error(`Missing required environment variable ${prefix}_NAME`);
    }

    const parsedChainId = parseInt(chainId);
    if (isNaN(parsedChainId) || parsedChainId <= 0) {
        throw new Error(`Invalid chain ID in ${prefix}_CHAIN_ID: ${chainId}`);
    }

    return {
        rpc,
        chainId: parsedChainId,
        name,
    };
}

export function loadEnvironment(): HyperlaneEnvironment {
    const deployerKey = process.env.HYPERLANE_DEPLOYER_KEY;
    const validatorKey = process.env.HYPERLANE_VALIDATOR_KEY;
    const relayerKey = process.env.HYPERLANE_RELAYER_KEY;

    if (!deployerKey || !validatorKey || !relayerKey) {
        throw new Error("Missing required Hyperlane keys");
    }

    const env = {
        HYPERLANE_DEPLOYER_KEY: deployerKey,
        HYPERLANE_VALIDATOR_KEY: validatorKey,
        HYPERLANE_RELAYER_KEY: relayerKey,
        ORIGIN_CHAIN: parseChainConfig("ORIGIN"),
        DESTINATION_CHAIN: parseChainConfig("DESTINATION"),
        HYPERLANE_GAS_PAYMENT_ENFORCED:
            process.env.HYPERLANE_GAS_PAYMENT_ENFORCED === "true",
        HYPERLANE_DEFAULT_GAS_LIMIT: parseInt(
            process.env.HYPERLANE_DEFAULT_GAS_LIMIT || "100000"
        ),
        HYPERLANE_TIMEOUT_SECONDS: parseInt(
            process.env.HYPERLANE_TIMEOUT_SECONDS || "300"
        ),
    };

    return HyperlaneEnvironmentSchema.parse(env);
}

export function getEnvironment(): HyperlaneEnvironment {
    try {
        return loadEnvironment();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues
                .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                .join("\n");
            throw new Error(
                `Invalid environment configuration:\n${missingVars}`
            );
        }
        throw error;
    }
}
