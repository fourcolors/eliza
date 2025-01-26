import { describe, it, expect } from 'vitest';
import { createConfig } from '../createConfig';
import { createProviderConfig } from '../createProviderConfig';

describe('createConfig', () => {
  it('creates immutable config', () => {
    const config = createConfig({
      domains: [1, 2],
      providers: [['1', 'https://eth-mainnet.example.com'], ['2', 'https://optimism.example.com']]
    });
    
    // Test that the config object itself is frozen
    expect(Object.isFrozen(config)).toBe(true);
    
    // Test that the domains Set is frozen
    expect(Object.isFrozen(config.domains)).toBe(true);
    
    // Test that the providers Map is frozen
    expect(Object.isFrozen(config.providers)).toBe(true);
    
    // Test that the hooks Map is frozen
    expect(Object.isFrozen(config.hooks)).toBe(true);
  });

  it('handles optional parameters', () => {
    const config = createConfig({
      domains: [1],
      providers: [['1', 'https://eth-mainnet.example.com']],
      defaultIsm: '0x123',
      hooks: [['preDispatch', () => {}]]
    });

    expect(config.defaultIsm).toBe('0x123');
    expect(config.hooks.size).toBe(1);
  });
});

describe('createProviderConfig', () => {
  it('creates immutable provider config', () => {
    const config = createConfig({
      domains: [1],
      providers: [['1', 'https://eth-mainnet.example.com']]
    });
    
    const providerConfig = createProviderConfig(config);
    
    // Test that all config objects are frozen
    expect(Object.isFrozen(providerConfig)).toBe(true);
    expect(Object.isFrozen(providerConfig.multiProvider)).toBe(true);
    expect(Object.isFrozen(providerConfig.storage)).toBe(true);
    expect(Object.isFrozen(providerConfig.security)).toBe(true);
    
    // Test that nested collections are frozen
    expect(Object.isFrozen(providerConfig.multiProvider.providers)).toBe(true);
    expect(Object.isFrozen(providerConfig.security.validators)).toBe(true);
  });
  
  it('sets correct default values', () => {
    const config = createConfig({
      domains: [1],
      providers: [['1', 'https://eth-mainnet.example.com']]
    });
    
    const providerConfig = createProviderConfig(config);
    
    // Verify storage defaults
    expect(providerConfig.storage.maxSize).toBe(1024 * 1024 * 10); // 10MB
    expect(providerConfig.storage.retentionDays).toBe(30);
    
    // Verify security defaults
    expect(providerConfig.security.defaultGasLimit).toBe(BigInt(1000000));
    expect(providerConfig.security.maxGasPerMessage).toBe(BigInt(2000000));
    expect(providerConfig.security.retryAttempts).toBe(3);
    expect(providerConfig.security.retryDelayMs).toBe(1000);
  });
});
