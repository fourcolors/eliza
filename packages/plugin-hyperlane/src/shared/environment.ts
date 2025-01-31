import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const hyperLandEnvSchema = z.object({
    HYP_EVM_KEY: z.string().min(1, "Hyperlane EVM key is required"),
    HYP_ORIGIN_CHAIN_NAME: z
        .string()
        .min(1, "Hyperlane origin chain name is required"),
});

export type HyperlaneConfig = z.infer<typeof hyperLandEnvSchema>;

export async function validateHyperlaneConfig(
    runtime: IAgentRuntime
): Promise<HyperlaneConfig> {
    try {
        const config = {
            HYP_EVM_KEY:
                runtime.getSetting("HYP_EVM_KEY") || process.env.HYP_EVM_KEY,
            HYP_ORIGIN_CHAIN_NAME:
                runtime.getSetting("HYP_ORIGIN_CHAIN_NAME") ||
                process.env.HYP_ORIGIN_CHAIN_NAME,
        };

        return hyperLandEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Hyperlane configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
