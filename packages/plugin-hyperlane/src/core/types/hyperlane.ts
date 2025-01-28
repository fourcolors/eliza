import { IService } from "@elizaos/core";
import { Provider } from "ethers";
import { IInterchainSecurityModule, IMailbox, IPostDispatchHook } from "@hyperlane-xyz/core";

/**
 * Configuration for a chain
 */
export interface ChainConfig {
    chainId: number;
    rpcUrl: string;
    mailbox: string;
    igp: string;
    name: string;
}

/**
 * Configuration for a token
 */
export interface TokenConfig {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
}

/**
 * Configuration for a warp route
 */
export interface WarpConfig {
    originChain: number;
    destinationChain: number;
    token: TokenConfig;
}

/**
 * Core message type for cross-chain communication
 */
export interface HyperlaneMessage {
    id: string;
    sender: string;
    recipient: string;
    body: string;
    origin: number;
    destination: number;
}

/**
 * Parameters for message dispatch
 */
export interface DispatchParams {
    destination: number;
    recipient: string;
    body: string;
}

/**
 * Result of message dispatch
 */
export interface DispatchResult {
    id: string;
    txHash: string;
    message: string;
}

/**
 * Parameters for message processing
 */
export interface ProcessParams {
    origin: number;
    sender: string;
    message: HyperlaneMessage;
}

/**
 * Result of message processing
 */
export interface ProcessResult {
    success: boolean;
    error?: string;
}

/**
 * Filter for querying messages
 */
export interface MessageFilter {
    origin?: number;
    destination?: number;
    sender?: string;
    recipient?: string;
}

/**
 * Parameters for sending warp tokens
 */
export interface WarpSendParams {
    originChain: number;
    destinationChain: number;
    amount: bigint;
    recipient?: string;
    token: TokenConfig;
}

/**
 * Result of sending warp tokens
 */
export interface WarpSendResult {
    txHash: string;
    messageId: string;
}

/**
 * Core service interface for Hyperlane integration
 */
export interface HyperlaneService extends IService {
    /**
     * Initialize the service
     */
    initialize(runtime: any): Promise<void>;
    
    /**
     * Get the mailbox for a domain
     */
    getMailbox(domain: number): Promise<IMailbox>;
    
    /**
     * Configure a warp route
     */
    configureWarpRoute(config: WarpConfig): Promise<string>;
    
    /**
     * Dispatch a message
     */
    dispatch(params: Readonly<DispatchParams>): Promise<Readonly<DispatchResult>>;
    
    /**
     * Process a message
     */
    process(params: Readonly<ProcessParams>): Promise<Readonly<ProcessResult>>;
    
    /**
     * Get the provider for a domain
     */
    getProvider(domain: number): Provider;
    
    /**
     * Get the list of supported domains
     */
    getDomains(): ReadonlyArray<number>;
    
    /**
     * Get the default interchain security module
     */
    getDefaultIsm(): Promise<IInterchainSecurityModule>;
    
    /**
     * Get the interchain security module for a recipient
     */
    getRecipientIsm(recipient: string): Promise<IInterchainSecurityModule>;
    
    /**
     * Check if a message has been delivered
     */
    isDelivered(messageId: string): Promise<boolean>;
    
    /**
     * Quote the dispatch of a message
     */
    quoteDispatch(params: Readonly<DispatchParams>): Promise<bigint>;

    /**
     * Send tokens using Hyperlane's warp protocol
     * @param params Parameters for sending warp tokens
     * @returns Result of the warp token send operation
     */
    sendWarpTokens(params: Readonly<WarpSendParams>): Promise<Readonly<WarpSendResult>>;

}
