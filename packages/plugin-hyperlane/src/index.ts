import type { Action, Plugin } from "@elizaos/core";

function createHyperlaneAction(): Action {
    return {
        name: "hyperlane.hello",
        description: "Basic Hyperlane bridge test action",
        similes: [],
        examples: [],
        handler: async () => {
            console.info("gm ser! Hyperlane bridge test initiated 🌉");
            return { text: "Ready to bridge some tokens ser! 🌉" };
        },
        validate: async () => true,
    };
}

export const hyperlanePlugin: Plugin = {
    name: "hyperlane",
    description: "Hyperlane cross-chain messaging plugin",
    actions: [createHyperlaneAction()],
    evaluators: [],
    providers: [],
};

export default hyperlanePlugin;
