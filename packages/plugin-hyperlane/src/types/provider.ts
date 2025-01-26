import { HyperlaneMessage, MessageFilter } from './hyperlane';

/**
 * Provider for configuration data
 */
export type ConfigProvider = () => Readonly<Record<string, unknown>>;

/**
 * Provider for message data
 */
export type MessageProvider = (
  filter?: Readonly<MessageFilter>
) => Promise<Readonly<{
  messages: ReadonlyArray<HyperlaneMessage>;
  count: number;
  filter?: MessageFilter;
}>>;

/**
 * Provider for domain data
 */
export type DomainProvider = () => Promise<Readonly<{
  domains: ReadonlyArray<number>;
  active: ReadonlySet<number>;
}>>;
