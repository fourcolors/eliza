# Hyperlane Plugin for Eliza

A plugin for the Eliza platform that enables cross-chain token transfers and messaging using the Hyperlane protocol.

## Features

### Bridge
- Token transfers between supported chains
- Transfer verification and status tracking
- Support for native and wrapped tokens

### Messaging
- Cross-chain message sending
- Message verification and retrieval
- Support for arbitrary message payloads

### Warp Routes
- Dynamic warp route configuration
- Route initialization and management
- Chain and token validation

### Chain Management
- Chain status monitoring
- RPC endpoint management
- Transaction tracking

## Project Structure

```
src/
├── features/           # Feature-specific functionality
│   ├── bridge/         # Token bridging
│   ├── messaging/      # Cross-chain messaging
│   ├── warp/          # Warp route management
│   └── chain/         # Chain management
├── core/              # Core functionality
│   ├── services/      # Core services
│   ├── config/        # Global configuration
│   └── types/         # Core types
└── shared/            # Shared utilities
    ├── constants/     # Global constants
    ├── utils/         # Shared utilities
    └── validators/    # Common validators
```

## Installation

```bash
pnpm add @elizaos/plugin-hyperlane
```

## Usage

```typescript
import { hyperlanePlugin } from '@elizaos/plugin-hyperlane';

// Initialize the plugin
agent.use(hyperlanePlugin);

// The plugin will now handle commands like:
// "transfer 1 ETH to optimism"
// "send message to arbitrum"
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
