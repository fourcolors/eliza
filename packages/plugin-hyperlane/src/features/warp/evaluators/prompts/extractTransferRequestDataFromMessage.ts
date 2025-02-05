/**
 * @file /packages/plugin-hyperlane/src/features/warp/evaluators/prompts/extractTransferRequestDataFromMessage.ts
 * Template for extracting transfer request information from user messages.
 */

import { TransferRequestData } from "@features/warp/types";
import { z } from "zod";

export const TransferRequestSchema = z.object({
    destinationChain: z.string(),
    tokenType: z.string(),
    amount: z.string(),
});

export const isValideSchemaObject = (
    object: any
): object is TransferRequestData => {
    if (TransferRequestSchema.safeParse(object).success) {
        return true;
    }

    console.error("Invalid warp data content: ", object);
    return false;
};

export const extractTransferRequestDataFromMessage = `TASK: Extract transfer request information from the conversation.

# CONTEXT
Available Chain Information:
{{chainMetadata}}

Recent Messages:
{{recentMessages}}

# INSTRUCTIONS
Analyze the recent messages to extract information about a transfer request:

1. Chain Selection:
- Match user's chain references to available chains
- Handle common variations (e.g., "poly" → "polygon", "op" → "optimism")
- Only return chains that exist in chainMetadata

2. Token Information:
- Extract token type (e.g., ETH, USDC)
- Normalize token symbols to uppercase
- Must be a valid token for the chain

3. Amount Information:
- Extract numerical amounts
- Handle decimal values
- Return as string format

# OUTPUT FORMAT
Return a JSON object with the following structure:
{
    "destinationChain": string,  // Chain name from chainMetadata
    "tokenType": string,         // Uppercase token symbol
    "amount": string            // Numerical amount as string
}

# EXAMPLES

Input: "I want to bridge to polygon"
Output:
{
    "destinationChain": "polygon",
    "tokenType": "ETH",
    "amount": "0"
}

Input: "Send 1.5 ETH to optimism"
Output:
{
    "destinationChain": "optimism",
    "tokenType": "ETH",
    "amount": "1.5"
}

Input: "Bridge 100 USDC to base"
Output:
{
    "destinationChain": "base",
    "tokenType": "USDC",
    "amount": "100"
}

# VALIDATION
1. Only return chains from chainMetadata
2. Token types must be uppercase
3. Amounts must be valid numbers as strings`;
