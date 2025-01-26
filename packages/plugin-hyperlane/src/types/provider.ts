import { HyperlaneMessage, MessageFilter } from './hyperlane';

/**
 * Provider for configuration data
 */
export type ConfigProvider = () => Readonly<Record<string, unknown>>;

/**
 * Provider for message data
 */
export type MessageProvider = {
  readonly listMessages: (
    filter?: Readonly<MessageFilter>
  ) => Promise<Readonly<{
    messages: ReadonlyArray<HyperlaneMessage>;
    count: number;
    filter?: MessageFilter;
  }>>;
  readonly getMessage: (messageId: string) => Promise<Readonly<{
    message: HyperlaneMessage;
    status: "pending" | "delivered" | "failed";
  }>>;
};

/**
 * Provider for domain data
 */
export type DomainProvider = () => Promise<Readonly<{
  domains: ReadonlyArray<number>;
  active: ReadonlySet<number>;
}>>;
