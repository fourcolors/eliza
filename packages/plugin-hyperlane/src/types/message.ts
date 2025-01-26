export interface HyperlaneMessage {
  readonly recipient: string
  readonly body: string
  readonly sender?: string
}

export type MessageStatus =
  | "pending"
  | "delivered"
  | "failed"
  | "verified"
  | "invalid"
  | "not_found"
  | "verification_failed"
