import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";
import { HyperlaneCore } from "@hyperlane-xyz/sdk";
import { IMessage } from "../types";

export class MessageHandlerProvider implements Provider {
    private hyperlane: HyperlaneCore;
    private initialized: boolean = false;

    constructor(hyperlane: HyperlaneCore) {
        this.hyperlane = hyperlane;
    }

    async get(
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<any> {
        if (!this.initialized) {
            return null;
        }
        return state;
    }

    async processIncomingMessage(message: IMessage) {
        try {
            if (!this.initialized) {
                throw new Error("MessageHandler not initialized");
            }

            if (message.type === "function_call") {
                await this.handleRemoteFunctionCall(message);
            } else {
                await this.handleGeneralMessage(message);
            }
        } catch (error) {
            console.error("Error processing message:", error);
            throw error;
        }
    }

    private async handleRemoteFunctionCall(message: IMessage) {
        try {
            const { functionName, args } = JSON.parse(message.body);
            const mailbox = await this.hyperlane.getMailbox();

            if (!mailbox) {
                throw new Error("Mailbox not available");
            }

            // Process the function call based on the functionName
            switch (functionName) {
                case "dispatch":
                    await this.handleDispatch(args);
                    break;
                case "process":
                    await this.handleProcess(args);
                    break;
                default:
                    throw new Error(`Unknown function: ${functionName}`);
            }
        } catch (error) {
            console.error("Error handling remote function call:", error);
            throw error;
        }
    }

    private async handleDispatch(args: any) {
        const { destination, recipient, body } = args;
        const mailbox = await this.hyperlane.getMailbox();
        await mailbox.dispatch(destination, recipient, body);
    }

    private async handleProcess(args: any) {
        const { messageId } = args;
        const mailbox = await this.hyperlane.getMailbox();
        await mailbox.process(messageId);
    }

    private async handleGeneralMessage(message: IMessage) {
        try {
            console.log("Processing general message:", message);
            const mailbox = await this.hyperlane.getMailbox();

            if (!mailbox) {
                throw new Error("Mailbox not available");
            }

            // Log message status
            const status = await mailbox.status(message.id);
            console.log("Message status:", status);
        } catch (error) {
            console.error("Error handling general message:", error);
            throw error;
        }
    }
}
