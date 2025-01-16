/**
 * Environment configuration for Hyperlane plugin
 */
import { z } from "zod";

// Chain configuration schema
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
    return {
        rpc: process.env[`${prefix}_RPC`] || "",
        chainId: parseInt(process.env[`${prefix}_CHAIN_ID`] || "0"),
        name: process.env[`${prefix}_NAME`] || "",
    };
}

export function loadEnvironment(): HyperlaneEnvironment {
    const env = {
        HYPERLANE_DEPLOYER_KEY: process.env.HYPERLANE_DEPLOYER_KEY || "",
        HYPERLANE_VALIDATOR_KEY: process.env.HYPERLANE_VALIDATOR_KEY || "",
        HYPERLANE_RELAYER_KEY: process.env.HYPERLANE_RELAYER_KEY || "",
        ORIGIN_CHAIN: parseChainConfig("ORIGIN"),
        DESTINATION_CHAIN: parseChainConfig("DESTINATION"),
        HYPERLANE_GAS_PAYMENT_ENFORCED:
            process.env.HYPERLANE_GAS_PAYMENT_ENFORCED,
        HYPERLANE_DEFAULT_GAS_LIMIT: process.env.HYPERLANE_DEFAULT_GAS_LIMIT,
        HYPERLANE_TIMEOUT_SECONDS: process.env.HYPERLANE_TIMEOUT_SECONDS,
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
