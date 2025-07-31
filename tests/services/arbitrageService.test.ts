import { ArbitrageService } from '../../src/services/arbitrageService';
import { AppDependencies } from '../../src/container';
import { SwapProvider } from '../../src/interfaces/swapProvider';
import { ContentPayment } from '../../src/interfaces/contentPayment';
import { Wallet } from '../../src/interfaces/wallet';
import { parseUnits } from 'viem';

// Mock the config module
jest.mock('../../src/config', () => ({
  config: {
    trading: {
      targetBalanceOut: 100,
      amountIn: 10,
      frequencyMs: 5000,
      profitThreshold: 0.5
    },
    tokens: {
      MAIN_TOKEN_SYMBOL: 'USDC',
      SECONDARY_TOKEN_SYMBOL: 'WETH',
      MAIN_TOKEN_ADDRESS: '0x1234567890123456789012345678901234567890',
      SECONDARY_TOKEN_ADDRESS: '0x0987654321098765432109876543210987654321'
    },
    x402: {
      paymentUrl: 'https://example.com/payment'
    },
    network: {
      name: 'base'
    }
  }
}));

// Mock the TokenUtils module
jest.mock('../../src/utils/tokenUtils', () => ({
  TokenUtils: {
    getDecimals: jest.fn().mockReturnValue(6) // USDC has 6 decimals
  }
}));

// Mock the ArbitrageLogger
jest.mock('../../src/services/arbitrageLogger', () => ({
  ArbitrageLogger: jest.fn().mockImplementation(() => ({
    displayStartupInfo: jest.fn(),
    displayTradingHeader: jest.fn(),
    logBotStart: jest.fn(),
    logBotStop: jest.fn(),
    logPriceEstimation: jest.fn(),
    logError: jest.fn(),
    logTradeOpportunity: jest.fn(),
    logTradeExecution: jest.fn(),
    logTradeSuccess: jest.fn(),
    logTargetReached: jest.fn(),
    logX402PaymentStart: jest.fn(),
    logX402PaymentSuccess: jest.fn(),
    logX402PaymentWarning: jest.fn(),
    displayFinalStats: jest.fn()
  }))
}));

describe('ArbitrageService', () => {
  let arbitrageService: ArbitrageService;
  let mockDependencies: AppDependencies;
  let mockCDPProvider: jest.Mocked<SwapProvider>;
  let mockCustomDEXProvider: jest.Mocked<SwapProvider>;
  let mockBuyer: jest.Mocked<ContentPayment>;
  let mockWallet: jest.Mocked<Wallet>;

  beforeEach(() => {
    // Create mock implementations
    mockCDPProvider = {
      estimatePrice: jest.fn(),
      executeSwap: jest.fn(),
      name: 'MockCDP'
    };

    mockCustomDEXProvider = {
      estimatePrice: jest.fn(),
      executeSwap: jest.fn(),
      name: 'MockDEX'
    };

    mockBuyer = {
      buyContent: jest.fn()
    };

    mockWallet = {
      getBalance: jest.fn()
    };

    mockDependencies = {
      cdpProvider: mockCDPProvider,
      customDEXProvider: mockCustomDEXProvider,
      buyer: mockBuyer,
      wallet: mockWallet
    };

    arbitrageService = new ArbitrageService(mockDependencies);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Stop any running loops
    arbitrageService.stop();
  });

  describe('initialization', () => {
    test('should initialize without errors', async () => {
      await expect(arbitrageService.initialize()).resolves.not.toThrow();
    });

    test('should set correct initial stats', () => {
      const stats = arbitrageService.getStats();
      expect(stats.txCount).toBe(0);
      expect(stats.sessionProfit).toBe(0);
      expect(stats.isRunning).toBe(false);
    });
  });

  describe('arbitrage detection', () => {
    test('should detect profitable arbitrage opportunity', async () => {
      const inputAmount = parseUnits('10', 6); // 10 USDC
      const wethOutput = parseUnits('0.004', 18); // 0.004 WETH
      const finalOutput = parseUnits('11', 6); // 11 USDC (1 USDC profit)

      mockCDPProvider.estimatePrice.mockResolvedValue(wethOutput);
      mockCustomDEXProvider.estimatePrice.mockResolvedValue(finalOutput);

      // Start the service briefly to trigger one cycle
      arbitrageService.start();
      
      // Wait for the cycle to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      arbitrageService.stop();

      expect(mockCDPProvider.estimatePrice).toHaveBeenCalledWith(
        inputAmount,
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321'
      );
      expect(mockCustomDEXProvider.estimatePrice).toHaveBeenCalledWith(
        wethOutput,
        '0x0987654321098765432109876543210987654321',
        '0x1234567890123456789012345678901234567890'
      );
    });

    test('should not execute trade when profit is below threshold', async () => {
      const inputAmount = parseUnits('10', 6);
      const wethOutput = parseUnits('0.004', 18);
      const finalOutput = parseUnits('10.1', 6); // Only 0.1 USDC profit (below 0.5 threshold)

      mockCDPProvider.estimatePrice.mockResolvedValue(wethOutput);
      mockCustomDEXProvider.estimatePrice.mockResolvedValue(finalOutput);

      arbitrageService.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      arbitrageService.stop();

      // Should not execute swaps when profit is below threshold
      expect(mockCDPProvider.executeSwap).not.toHaveBeenCalled();
      expect(mockCustomDEXProvider.executeSwap).not.toHaveBeenCalled();
    });

    test('should execute trade when profit exceeds threshold', async () => {
      const inputAmount = parseUnits('10', 6);
      const wethOutput = parseUnits('0.004', 18);
      const finalOutput = parseUnits('11', 6); // 1 USDC profit (above 0.5 threshold)

      mockCDPProvider.estimatePrice.mockResolvedValue(wethOutput);
      mockCustomDEXProvider.estimatePrice.mockResolvedValue(finalOutput);
      mockCDPProvider.executeSwap.mockResolvedValue(wethOutput);
      mockCustomDEXProvider.executeSwap.mockResolvedValue(finalOutput);

      arbitrageService.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      arbitrageService.stop();

      expect(mockCDPProvider.executeSwap).toHaveBeenCalled();
      expect(mockCustomDEXProvider.executeSwap).toHaveBeenCalled();
    });
  });

  describe('session management', () => {
    test('should start and stop properly', () => {
      expect(arbitrageService.getStats().isRunning).toBe(false);
      
      arbitrageService.start();
      expect(arbitrageService.getStats().isRunning).toBe(true);
      
      arbitrageService.stop();
      expect(arbitrageService.getStats().isRunning).toBe(false);
    });

    test('should track transaction count and session profit', async () => {
      const inputAmount = parseUnits('10', 6);
      const wethOutput = parseUnits('0.004', 18);
      const finalOutput = parseUnits('11', 6); // 1 USDC profit

      mockCDPProvider.estimatePrice.mockResolvedValue(wethOutput);
      mockCustomDEXProvider.estimatePrice.mockResolvedValue(finalOutput);
      mockCDPProvider.executeSwap.mockResolvedValue(wethOutput);
      mockCustomDEXProvider.executeSwap.mockResolvedValue(finalOutput);

      arbitrageService.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      arbitrageService.stop();

      const stats = arbitrageService.getStats();
      expect(stats.txCount).toBeGreaterThan(0);
      expect(stats.sessionProfit).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    test('should handle CDP provider estimation errors gracefully', async () => {
      mockCDPProvider.estimatePrice.mockResolvedValue(undefined);

      arbitrageService.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      arbitrageService.stop();

      // Should not proceed to second estimation
      expect(mockCustomDEXProvider.estimatePrice).not.toHaveBeenCalled();
    });

    test('should handle DEX provider estimation errors gracefully', async () => {
      const wethOutput = parseUnits('0.004', 18);
      
      mockCDPProvider.estimatePrice.mockResolvedValue(wethOutput);
      mockCustomDEXProvider.estimatePrice.mockResolvedValue(undefined);

      arbitrageService.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      arbitrageService.stop();

      expect(mockCDPProvider.estimatePrice).toHaveBeenCalled();
      expect(mockCustomDEXProvider.estimatePrice).toHaveBeenCalled();
      // Should not execute any swaps
      expect(mockCDPProvider.executeSwap).not.toHaveBeenCalled();
    });

    test('should handle swap execution errors gracefully', async () => {
      const inputAmount = parseUnits('10', 6);
      const wethOutput = parseUnits('0.004', 18);
      const finalOutput = parseUnits('11', 6);

      mockCDPProvider.estimatePrice.mockResolvedValue(wethOutput);
      mockCustomDEXProvider.estimatePrice.mockResolvedValue(finalOutput);
      mockCDPProvider.executeSwap.mockResolvedValue(undefined); // First swap fails

      arbitrageService.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      arbitrageService.stop();

      expect(mockCDPProvider.executeSwap).toHaveBeenCalled();
      // Should not proceed to second swap
      expect(mockCustomDEXProvider.executeSwap).not.toHaveBeenCalled();
    });
  });

  describe('x402 payment integration', () => {
    test('should execute x402 payment when target is reached', async () => {
      // Set up a scenario where session profit reaches target (100 USDC)
      const inputAmount = parseUnits('10', 6);
      const wethOutput = parseUnits('0.004', 18);
      const finalOutput = parseUnits('110', 6); // 100 USDC profit to reach target

      mockCDPProvider.estimatePrice.mockResolvedValue(wethOutput);
      mockCustomDEXProvider.estimatePrice.mockResolvedValue(finalOutput);
      mockCDPProvider.executeSwap.mockResolvedValue(wethOutput);
      mockCustomDEXProvider.executeSwap.mockResolvedValue(finalOutput);
      mockBuyer.buyContent.mockResolvedValue('success');

      arbitrageService.start();
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockBuyer.buyContent).toHaveBeenCalledWith('https://example.com/payment');
      expect(arbitrageService.getStats().isRunning).toBe(false); // Should stop after reaching target
    });
  });
});
