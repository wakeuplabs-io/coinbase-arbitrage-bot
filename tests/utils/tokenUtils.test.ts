// Mock the config module to avoid importing CdpClient
jest.mock('../../src/config', () => ({
  config: {
    tokens: {
      MAIN_TOKEN_SYMBOL: 'USDC',
      MAIN_TOKEN_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      MAIN_TOKEN_DECIMALS: 6,
      SECONDARY_TOKEN_SYMBOL: 'WETH',
      SECONDARY_TOKEN_ADDRESS: '0x4200000000000000000000000000000000000006',
      SECONDARY_TOKEN_DECIMALS: 18
    },
    network: {
      name: 'base'
    }
  }
}));

// Mock the modules that have external dependencies
jest.mock('@coinbase/cdp-sdk', () => ({}));
jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  http: jest.fn(),
  erc20Abi: [],
  encodeFunctionData: jest.fn(),
}));
jest.mock('viem/chains', () => ({
  base: {},
  mainnet: {}
}));

import { TokenUtils, TOKENS } from '../../src/utils/tokenUtils';

describe('TokenUtils', () => {
  describe('getDecimals', () => {
    test('should return correct decimals for USDC', () => {
      const decimals = TokenUtils.getDecimals('USDC');
      expect(decimals).toBe(6);
    });

    test('should return correct decimals for WETH', () => {
      const decimals = TokenUtils.getDecimals('WETH');
      expect(decimals).toBe(18);
    });

    test('should throw error for unknown token', () => {
      expect(() => {
        TokenUtils.getDecimals('UNKNOWN');
      }).toThrow("Token with symbol 'UNKNOWN' not found. Available tokens: USDC, WETH");
    });
  });

  describe('getTokenInfo', () => {
    test('should return complete token info for USDC', () => {
      const tokenInfo = TokenUtils.getTokenInfo('USDC');
      expect(tokenInfo).toEqual({
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        symbol: 'USDC',
        decimals: 6
      });
    });

    test('should return complete token info for WETH', () => {
      const tokenInfo = TokenUtils.getTokenInfo('WETH');
      expect(tokenInfo).toEqual({
        address: '0x4200000000000000000000000000000000000006',
        symbol: 'WETH',
        decimals: 18
      });
    });

    test('should throw error for unknown token', () => {
      expect(() => {
        TokenUtils.getTokenInfo('UNKNOWN');
      }).toThrow("Token with symbol 'UNKNOWN' not found. Available tokens: USDC, WETH");
    });
  });

  describe('getAddress', () => {
    test('should return correct address for USDC', () => {
      const address = TokenUtils.getAddress('USDC');
      expect(address).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
    });

    test('should return correct address for WETH', () => {
      const address = TokenUtils.getAddress('WETH');
      expect(address).toBe('0x4200000000000000000000000000000000000006');
    });

    test('should throw error for unknown token', () => {
      expect(() => {
        TokenUtils.getAddress('UNKNOWN');
      }).toThrow("Token with symbol 'UNKNOWN' not found. Available tokens: USDC, WETH");
    });
  });

  describe('exists', () => {
    test('should return true for existing tokens', () => {
      expect(TokenUtils.exists('USDC')).toBe(true);
      expect(TokenUtils.exists('WETH')).toBe(true);
    });

    test('should return false for non-existing tokens', () => {
      expect(TokenUtils.exists('UNKNOWN')).toBe(false);
      expect(TokenUtils.exists('BTC')).toBe(false);
      expect(TokenUtils.exists('')).toBe(false);
    });

    test('should be case-sensitive', () => {
      expect(TokenUtils.exists('usdc')).toBe(false);
      expect(TokenUtils.exists('weth')).toBe(false);
      expect(TokenUtils.exists('Usdc')).toBe(false);
    });
  });

  describe('TOKENS configuration', () => {
    test('should have correct TOKENS object structure', () => {
      expect(TOKENS).toHaveProperty('USDC');
      expect(TOKENS).toHaveProperty('WETH');
      
      expect(TOKENS.USDC).toEqual({
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        symbol: 'USDC',
        decimals: 6
      });
      
      expect(TOKENS.WETH).toEqual({
        address: '0x4200000000000000000000000000000000000006',
        symbol: 'WETH',
        decimals: 18
      });
    });

    test('should contain only expected tokens', () => {
      const tokenSymbols = Object.keys(TOKENS);
      expect(tokenSymbols).toEqual(['USDC', 'WETH']);
      expect(tokenSymbols).toHaveLength(2);
    });
  });
});
