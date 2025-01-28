/**
 * Core Utilities Index for Hyperlane Plugin
 *
 * This module serves as the main entry point for all core utility functions used in the Hyperlane plugin.
 * It exports functionality for:
 *
 * 1. Chain metadata assembly and configuration (metadata.ts)
 * 2. Warp route setup and management (warpCore.ts)
 * 3. Token and route configuration helpers
 *
 * The utilities provided here are used throughout the plugin to standardize chain interactions,
 * token bridging, and cross-chain messaging configurations.
 */
export * from "./metadata";
export * from "./warpCore";
