# @elizaos/plugin-hyperlane

A plugin for Eliza that provides cross-chain messaging capabilities using the Hyperlane protocol.

## Features

- Send messages across different blockchain networks
- Check message delivery status
- Functional programming approach with pure functions and immutable data structures

## Installation

```bash
pnpm add @elizaos/plugin-hyperlane
```

## Configuration

The plugin requires the following environment variables:

```env
HYPERLANE_RPC_ENDPOINTS='{"1":"https://ethereum-rpc","137":"https://polygon-rpc"}'
HYPERLANE_PRIVATE_KEY="optional-private-key-for-signing"
```

## Usage

```typescript
import { hyperlanePlugin } from "@elizaos/plugin-hyperlane"

// Add to your character configuration
const character = {
    // ...other config
    plugins: [hyperlanePlugin]
}

// Example action usage
await runtime.executeAction("sendMessage", {
    originChain: "1",
    destinationChain: "137",
    message: "Hello cross-chain world!",
    gasAmount: "1000000"
})
```

## Actions

### sendMessage
Send a message across chains using Hyperlane.

Parameters:
- `originChain`: Origin chain ID
- `destinationChain`: Destination chain ID
- `message`: Message to send
- `gasAmount`: (Optional) Gas amount for message delivery

### getMessage
Retrieve a message status from Hyperlane.

Parameters:
- `messageId`: ID of the message to retrieve
- `chainId`: Chain ID where the message was sent

## Development

```bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Run tests
pnpm test
```

## License

MIT
