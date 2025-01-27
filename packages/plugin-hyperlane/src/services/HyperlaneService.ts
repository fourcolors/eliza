/**
 * HyperlaneService.ts
 *
 * Service for managing Hyperlane cross-chain messaging and token transfers.
 * Currently handles basic initialization and registration with the plugin system.
 */

import {
    elizaLogger,
    IAgentRuntime,
    Service,
    ServiceType,
} from "@elizaos/core";

export class HyperlaneService extends Service {
    static serviceType: ServiceType = ServiceType.HYPERLANE;

    private initialized: boolean = false;
    private runtime: IAgentRuntime | null = null;

    async initialize(runtime: IAgentRuntime): Promise<void> {
        if (this.initialized) {
            return;
        }

        elizaLogger.log("Initializing HyperlaneService");
        this.runtime = runtime;
        this.initialized = true;
    }
}
