# Manual Testing Guide for Token Transfers

This guide explains how to manually test token transfers using the Hyperlane plugin.

## Prerequisites

1. Set up environment variables in `.env`:
   ```
   PRIVATE_KEY=your_private_key_here
   SEPOLIA_RPC_URL=your_sepolia_rpc_url
   MUMBAI_RPC_URL=your_mumbai_rpc_url
   ```

2. Make sure you have test tokens:
   - Sepolia ETH (get from https://sepoliafaucet.com)
   - Mumbai MATIC (get from https://faucet.polygon.technology)

## Running the Tests

1. Build the project:
   ```bash
   pnpm build
   ```

2. Run the test script:
   ```bash
   pnpm ts-node scripts/test-token-transfer.ts
   ```

## Test Cases

### Native Token Transfer
1. Initialize route between Sepolia and Mumbai
2. Check route status
3. Estimate gas for transfer
4. Calculate transfer fee
5. View all routes

### Expected Output
```
Wallet address: 0x...
Initializing native token route...
Native route initialized: 11155111-80001-native
Route status: { status: 'active', ... }
Gas estimate: 165000
Transfer fee: 0.0001 ETH
All routes: [...]
```

## Troubleshooting

1. If you get RPC errors:
   - Check your RPC URLs
   - Make sure you have enough test tokens

2. If you get wallet errors:
   - Verify your private key is correct
   - Ensure you have enough balance for gas

3. If route initialization fails:
   - Check chain IDs are correct
   - Verify token configuration

## Support

For issues or questions:
1. Check the error messages in the console
2. Review the Hyperlane documentation
3. Open an issue in the repository
