export interface TransferRequestData {
    destinationChain: string;
    tokenType: string;
    amount: string;
}

export interface TransferRequestState extends TransferRequestData {
    validationErrors?: string[];
}
