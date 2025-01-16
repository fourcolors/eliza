export interface HyperlaneConfig {
    originChain: string;
    destinationChain: string;
    rpcUrls: {
        [chainId: string]: string;
    };
}

export interface IMessage {
    id: string;
    type: string;
    body: string;
    status: string;
}

export interface MultiProvider {
    // Add required MultiProvider interface properties
    getProvider: (chainId: string) => any;
}
