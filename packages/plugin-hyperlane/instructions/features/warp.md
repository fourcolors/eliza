# Warp Protocol Features

## Pre-Transfer Asset Validations

Before executing a cross-chain token transfer via Hyperlane's Warp protocol, the following validations must be performed:

### 1. Chain and Protocol Validations
- [x] Verify chain existence in Hyperlane registry
- [x] Check RPC endpoint availability
- [x] Validate chain protocol compatibility
- [ ] Confirm active account exists for origin chain

### 2. Token and Route Validations
- [ ] Verify token route exists between chains
- [ ] Check token protocol compatibility
- [ ] Validate token type (NFT vs fungible token)
- [ ] Verify token decimals and format

### 3. Balance and Collateral Validations
- [ ] Check destination chain collateral sufficiency
- [ ] Verify sender has sufficient balance
- [ ] Validate token allowance (for ERC20 tokens)

### 4. Transaction Validations
- [ ] Estimate gas fees
- [ ] Validate against transaction timeouts
- [ ] Verify chain connection status

Each validation step should return clear error messages to help users understand and resolve any issues that prevent the transfer from proceeding.

### Implementation Status:
- ✅ `validateChainSupport.ts`: Implements chain existence, RPC endpoint, and protocol compatibility checks
- 🚧 `validateTransferParams.ts`: In progress - Will implement remaining validations
