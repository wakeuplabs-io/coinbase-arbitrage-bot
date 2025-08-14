import { MockUniswapProvider } from '../../src/mocks/mockUniswapProvider';
import { parseUnits } from 'viem';

describe('MockUniswapProvider', () => {
  let mockUniswapProvider: MockUniswapProvider;

  beforeEach(() => {
    mockUniswapProvider = new MockUniswapProvider();
  });

  describe('estimatePrice', () => {
    test('should return estimated price with random factor between 1.01 and 1.05', async () => {
      const inputAmount = parseUnits('100', 6); // 100 USDC
      const tokenIn = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
      const tokenOut = '0x4200000000000000000000000000000000000006' as const;

      const estimatedPrice = await mockUniswapProvider.estimatePrice(
        inputAmount,
        tokenIn,
        tokenOut,
      );

      expect(estimatedPrice).toBeDefined();
      expect(estimatedPrice).toBeGreaterThan(inputAmount); // Should be more than input

      // Should be between 1.01x and 1.05x of input amount
      const minExpected = (inputAmount * 101n) / 100n; // 1.01x
      const maxExpected = (inputAmount * 105n) / 100n; // 1.05x

      expect(estimatedPrice).toBeGreaterThanOrEqual(minExpected);
      expect(estimatedPrice).toBeLessThanOrEqual(maxExpected);
    });

    test('should return different values on subsequent calls due to randomness', async () => {
      const inputAmount = parseUnits('100', 6);
      const tokenIn = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
      const tokenOut = '0x4200000000000000000000000000000000000006' as const;

      // Generate multiple prices to test randomness
      const prices = await Promise.all(
        Array(10)
          .fill(0)
          .map(() => mockUniswapProvider.estimatePrice(inputAmount, tokenIn, tokenOut)),
      );

      // Not all prices should be identical (very low probability with random factor)
      const uniquePrices = new Set(prices.map(p => p?.toString()));
      expect(uniquePrices.size).toBeGreaterThan(1);
    });

    test('should handle zero input amount', async () => {
      const inputAmount = 0n;
      const tokenIn = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
      const tokenOut = '0x4200000000000000000000000000000000000006' as const;

      const estimatedPrice = await mockUniswapProvider.estimatePrice(
        inputAmount,
        tokenIn,
        tokenOut,
      );

      expect(estimatedPrice).toBeDefined();
      expect(estimatedPrice).toBe(0n);
    });

    test('should handle very large input amounts', async () => {
      const inputAmount = parseUnits('1000000', 6); // 1M USDC
      const tokenIn = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
      const tokenOut = '0x4200000000000000000000000000000000000006' as const;

      const estimatedPrice = await mockUniswapProvider.estimatePrice(
        inputAmount,
        tokenIn,
        tokenOut,
      );

      expect(estimatedPrice).toBeDefined();
      expect(estimatedPrice).toBeGreaterThan(inputAmount);

      // Verify the multiplication doesn't cause overflow issues
      expect(typeof estimatedPrice).toBe('bigint');
    });
  });

  describe('executeSwap', () => {
    test('should return the same value as estimatePrice', async () => {
      const inputAmount = parseUnits('100', 6);
      const tokenIn = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
      const tokenOut = '0x4200000000000000000000000000000000000006' as const;

      // Mock Math.random to return a consistent value for this test
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const estimatedPrice = await mockUniswapProvider.estimatePrice(
        inputAmount,
        tokenIn,
        tokenOut,
      );
      const swapResult = await mockUniswapProvider.executeSwap(inputAmount, tokenIn, tokenOut);

      expect(swapResult).toEqual(estimatedPrice);

      mockRandom.mockRestore();
    });

    test('should work with different token pairs', async () => {
      const inputAmount = parseUnits('1', 18); // 1 WETH
      const tokenIn = '0x4200000000000000000000000000000000000006' as const; // WETH
      const tokenOut = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const; // USDC

      const swapResult = await mockUniswapProvider.executeSwap(inputAmount, tokenIn, tokenOut);

      expect(swapResult).toBeDefined();
      expect(swapResult).toBeGreaterThan(inputAmount);
    });
  });

  describe('provider identification', () => {
    test('should have correct name', () => {
      expect(mockUniswapProvider.name).toBe('MockUniswap');
    });

    test('should implement SwapProvider interface', () => {
      expect(typeof mockUniswapProvider.estimatePrice).toBe('function');
      expect(typeof mockUniswapProvider.executeSwap).toBe('function');
      expect(typeof mockUniswapProvider.name).toBe('string');
    });
  });

  describe('comparison with MockCDPProvider behavior', () => {
    test('should behave similarly to MockCDPProvider', async () => {
      const inputAmount = parseUnits('100', 6);
      const tokenIn = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
      const tokenOut = '0x4200000000000000000000000000000000000006' as const;

      const price = await mockUniswapProvider.estimatePrice(inputAmount, tokenIn, tokenOut);

      // Should use the same random factor range as MockCDPProvider
      const minExpected = (inputAmount * 101n) / 100n; // 1.01x
      const maxExpected = (inputAmount * 105n) / 100n; // 1.05x

      expect(price).toBeGreaterThanOrEqual(minExpected);
      expect(price).toBeLessThanOrEqual(maxExpected);
    });
  });
});
