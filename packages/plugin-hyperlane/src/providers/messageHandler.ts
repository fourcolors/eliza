import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";
import { HyperlaneCore } from "@hyperlane-xyz/sdk";
import { IMessage } from "../types";

export class MessageHandlerProvider implements Provider {
    private hyperlane: HyperlaneCore;

    constructor(hyperlane: HyperlaneCore) {
        this.hyperlane = hyperlane;
    }

    async get(
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<any> {
        return null;
    }

    async processIncomingMessage(message: IMessage) {
        if (message.type === "function_call") {
            await this.handleRemoteFunctionCall(message);
        } else {
            await this.handleGeneralMessage(message);
        }
    }

    private async handleRemoteFunctionCall(message: IMessage) {
        const { functionName, args } = JSON.parse(message.body);
    }

    private async handleGeneralMessage(message: IMessage) {
        console.log("Received message:", message);
    }
}
