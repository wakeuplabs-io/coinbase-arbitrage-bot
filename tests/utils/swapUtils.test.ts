import * as swapUtils from '../../src/utils/swapUtils';

describe('SwapUtils', () => {
  describe('validateSwapQuote', () => {
    test('should return true for valid swap quote without issues', () => {
      const validSwapQuote = {
        amountIn: '1000000',
        amountOut: '950000',
        priceImpact: '0.02',
      };

      const result = swapUtils.validateSwapQuote(validSwapQuote);
      expect(result).toBe(true);
    });

    test('should return false for swap quote with balance issues', () => {
      const swapQuoteWithBalanceIssues = {
        amountIn: '1000000',
        amountOut: '950000',
        issues: {
          balance: {
            currentBalance: '500000',
            requiredBalance: '1000000',
            token: 'USDC',
          },
        },
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = swapUtils.validateSwapQuote(swapQuoteWithBalanceIssues);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('❌ Balance Issues:');
      expect(consoleSpy).toHaveBeenCalledWith('   Current: 500000');
      expect(consoleSpy).toHaveBeenCalledWith('   Required: 1000000');
      expect(consoleSpy).toHaveBeenCalledWith('   Token: USDC');

      consoleSpy.mockRestore();
    });

    test('should return false for swap quote with allowance issues', () => {
      const swapQuoteWithAllowanceIssues = {
        amountIn: '1000000',
        amountOut: '950000',
        issues: {
          allowance: {
            currentAllowance: '0',
            requiredAllowance: '1000000',
            spender: '0x1234567890123456789012345678901234567890',
          },
        },
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = swapUtils.validateSwapQuote(swapQuoteWithAllowanceIssues);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('❌ Allowance Issues:');
      expect(consoleSpy).toHaveBeenCalledWith('   Current: 0');
      expect(consoleSpy).toHaveBeenCalledWith('   Required: 1000000');
      expect(consoleSpy).toHaveBeenCalledWith(
        '   Spender: 0x1234567890123456789012345678901234567890',
      );

      consoleSpy.mockRestore();
    });

    test('should return true but log warning for incomplete simulation', () => {
      const swapQuoteWithSimulationWarning = {
        amountIn: '1000000',
        amountOut: '950000',
        issues: {
          simulationIncomplete: true,
        },
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = swapUtils.validateSwapQuote(swapQuoteWithSimulationWarning);

      expect(result).toBe(true); // Should still be valid, just a warning
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ WARNING: Simulation incomplete - transaction may fail',
      );

      consoleSpy.mockRestore();
    });

    test('should return false for swap quote with multiple issues', () => {
      const swapQuoteWithMultipleIssues = {
        amountIn: '1000000',
        amountOut: '950000',
        issues: {
          balance: {
            currentBalance: '500000',
            requiredBalance: '1000000',
            token: 'USDC',
          },
          allowance: {
            currentAllowance: '0',
            requiredAllowance: '1000000',
            spender: '0x1234567890123456789012345678901234567890',
          },
          simulationIncomplete: true,
        },
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = swapUtils.validateSwapQuote(swapQuoteWithMultipleIssues);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('❌ Balance Issues:');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Allowance Issues:');
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ WARNING: Simulation incomplete - transaction may fail',
      );

      consoleSpy.mockRestore();
    });

    test('should handle undefined or null issues gracefully', () => {
      const swapQuoteWithoutIssues = {
        amountIn: '1000000',
        amountOut: '950000',
        issues: null,
      };

      const result = swapUtils.validateSwapQuote(swapQuoteWithoutIssues);
      expect(result).toBe(true);
    });

    test('should handle empty swap quote object', () => {
      const emptySwapQuote = {};

      const result = swapUtils.validateSwapQuote(emptySwapQuote);
      expect(result).toBe(true);
    });

    test('should handle undefined swap quote', () => {
      const result = swapUtils.validateSwapQuote(undefined);
      expect(result).toBe(true);
    });
  });
});
