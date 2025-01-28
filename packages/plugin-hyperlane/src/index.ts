/**
 * /packages/plugin-hyperlane/src/index.ts
 * 
 * Main entry point for the Hyperlane plugin.
 * Exports feature-organized functionality for cross-chain messaging and token transfers.
 */

// Core exports
export * from "@core/services/HyperlaneService";
export * from "@core/types";
export * from "@core/config";

// Feature exports
export * from "@features/bridge/actions";
export * from "@features/messaging/actions";
export * from "@features/warp/actions";
export * from "@features/chain/actions";

// Plugin export
export { hyperlanePlugin as default } from "./plugin";
