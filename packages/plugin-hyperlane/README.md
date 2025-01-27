# @elizaos/plugin-hyperlane

Hyperlane plugin for Eliza, enabling cross-chain messaging and asset transfers.

## Features

- Cross-chain message passing using Hyperlane protocol
- Message verification using Interchain Security Module (ISM)
- Asset transfers via Warp Routes
- Leverages Eliza's core storage for message persistence and state management

## Installation

```bash
pnpm add @elizaos/plugin-hyperlane
```

## Usage

```typescript
import { HyperlanePlugin } from '@elizaos/plugin-hyperlane'

// Initialize plugin
const plugin = new HyperlanePlugin()

// Register with Eliza runtime
runtime.registerPlugin(plugin)

// Send a cross-chain message
await runtime.executeAction('hyperlane.sendMessage', {
  recipient: '0x123...',
  body: 'Hello cross-chain world!',
  destinationChain: 'ethereum'
})

// Verify a received message
await runtime.executeAction('hyperlane.verifyMessage', {
  messageId: '123'
})
```

## Architecture

The plugin integrates with several core components:

1. **Eliza Core Services**
   - Uses Eliza's core storage service for message persistence
   - Leverages core service management for dependency injection
   - Integrates with core action handling system

2. **Hyperlane Protocol**
   - Mailbox contracts for message passing
   - ISM for message verification
   - Warp Routes for asset transfers

3. **Plugin Components**
   - Message dispatch provider
   - ISM provider
   - Message verification handler
   - Asset transfer handler

## Configuration

```typescript
{
  // Chain configuration
  domains: [1, 2], // Chain IDs
  providers: [
    ['ethereum', 'https://eth-mainnet.provider.com'],
    ['optimism', 'https://opt-mainnet.provider.com']
  ],
  
  // Security settings
  defaultIsm: '0x123...', // Default ISM address
  defaultHook: myHook, // Optional post-dispatch hook
  requiredHook: myRequiredHook, // Required post-dispatch hook
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test
```

## License

MIT
