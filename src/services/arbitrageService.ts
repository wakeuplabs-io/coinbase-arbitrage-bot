/**
 * Arbitrage Service
 * 
 * This service contains the core arbitrage trading logic, separated from
 * dependency management for better testability and maintainability.
 * 
 * @module arbitrageService
 */

import { formatUnits, parseUnits } from 'viem';
import { config } from '../config';
import { AppDependencies } from '../container';
import { ArbitrageLogger } from './arbitrageLogger';

/**
 * Trade execution result interface for type safety
 */
export interface TradeResult {
  amountIn: bigint;
  amountOut: bigint;
  netProfit: bigint;
  profitPercentage: number;
  gasUsed: bigint;
  txHash?: string;
}

/**
 * Arbitrage service that handles trading logic with injected dependencies
 */
export class ArbitrageService {
  private dependencies: AppDependencies;
  private logger: ArbitrageLogger;
  private txCount = 0;
  private startTime = Date.now();
  private sessionProfit = 0;
  private loop: NodeJS.Timeout | undefined;

  // Convert target balance to USDC format (6 decimals)
  private readonly balanceOut = parseUnits(config.trading.targetBalanceOut.toString(), 6);
  private readonly amountIn = parseUnits(config.trading.amountIn.toString(), 6);
  private readonly USDC_DECIMALS = 6;

  constructor(dependencies: AppDependencies) {
    this.dependencies = dependencies;
    this.logger = new ArbitrageLogger();
  }

  /**
   * Initialize the arbitrage service
   */
  async initialize(): Promise<void> {
    this.logger.displayStartupInfo(this.amountIn, this.balanceOut);
    this.logger.displayTradingHeader();
  }

  /**
   * Start the arbitrage bot with periodic trading checks
   */
  start(): void {
    this.logger.logBotStart();
    this.executeArbitrageCycle();
    
    this.loop = setInterval(() => {
      this.executeArbitrageCycle();
    }, config.trading.frequencyMs);
  }

  /**
   * Stop the arbitrage bot
   */
  stop(): void {
    if (this.loop) {
      clearInterval(this.loop);
      this.loop = undefined;
      this.logger.logBotStop();
    }
  }

  /**
   * Execute a single arbitrage cycle
   */
  private async executeArbitrageCycle(): Promise<void> {
    try {
      const inputAmount = this.amountIn;

      // Step 1: Get WETH from CDP
      this.logger.logPriceEstimation("WETH from CDP");
      const wethFromCDP = await this.dependencies.cdpProvider.estimatePrice(
        inputAmount, 
        config.tokens.MAIN_TOKEN_ADDRESS as `0x${string}`, 
        config.tokens.SECONDARY_TOKEN_ADDRESS as `0x${string}`
      );

      if (!wethFromCDP) {
        this.logger.logError("Failed to get WETH price from CDP");
        return;
      }

      // Step 2: Get USDC from DEX using the WETH amount
      this.logger.logPriceEstimation("USDC from DEX");
      const usdcFromDEX = await this.dependencies.customDEXProvider.estimatePrice(
        wethFromCDP, 
        config.tokens.SECONDARY_TOKEN_ADDRESS as `0x${string}`, 
        config.tokens.MAIN_TOKEN_ADDRESS as `0x${string}`
      );

      if (!usdcFromDEX) {
        this.logger.logError("Failed to get USDC price from DEX");
        return;
      }

      // Calculate profit
      const netProfit = usdcFromDEX - inputAmount;
      const profitPercentage = (Number(formatUnits(netProfit, this.USDC_DECIMALS)) / Number(formatUnits(inputAmount, this.USDC_DECIMALS))) * 100;
      
      // Check if profit exceeds threshold
      const profitThresholdAmount = parseUnits(config.trading.profitThreshold.toString(), this.USDC_DECIMALS);
      const shouldExecute = netProfit >= profitThresholdAmount;

      // Execute trade if profitable
      if (shouldExecute) {
        await this.executeTrade(inputAmount, wethFromCDP, usdcFromDEX, netProfit);
      }

      // Log the trade opportunity
      this.logger.logTradeOpportunity({
        amountIn: inputAmount,
        amountOut: usdcFromDEX,
        netProfit,
        profitPercentage,
        gasUsed: 0n // Will be updated if trade is executed
      }, shouldExecute, this.txCount, this.sessionProfit, this.dependencies.cdpProvider.name, this.dependencies.customDEXProvider.name);

      // Check if target profit reached
      if (this.sessionProfit >= Number(formatUnits(this.balanceOut, this.USDC_DECIMALS))) {
        this.logger.logTargetReached();
        await this.executeX402Payment();
        this.stop();
      }

    } catch (error) {
      this.logger.logError("Error in arbitrage cycle", error);
    }
  }

  /**
   * Execute the actual trade
   */
  private async executeTrade(
    inputAmount: bigint, 
    wethAmount: bigint, 
    expectedOutput: bigint, 
    expectedProfit: bigint
  ): Promise<void> {
    try {
      this.logger.logTradeExecution();

      // Execute first swap: USDC -> WETH via CDP
      const actualWeth = await this.dependencies.cdpProvider.executeSwap(
        inputAmount,
        config.tokens.MAIN_TOKEN_ADDRESS as `0x${string}`,
        config.tokens.MAIN_TOKEN_SYMBOL,
        config.tokens.SECONDARY_TOKEN_ADDRESS as `0x${string}`
      );

      if (!actualWeth) {
        this.logger.logError("First swap failed");
        return;
      }

      // Execute second swap: WETH -> USDC via DEX
      const actualOutput = await this.dependencies.customDEXProvider.executeSwap(
        actualWeth,
        config.tokens.SECONDARY_TOKEN_ADDRESS as `0x${string}`,
        config.tokens.SECONDARY_TOKEN_SYMBOL,
        config.tokens.MAIN_TOKEN_ADDRESS as `0x${string}`
      );

      if (!actualOutput) {
        this.logger.logError("Second swap failed");
        return;
      }

      // Calculate actual profit
      const actualProfit = actualOutput - inputAmount;
      const actualProfitUSDC = Number(formatUnits(actualProfit, this.USDC_DECIMALS));
      
      this.sessionProfit += actualProfitUSDC;
      this.txCount++;

      this.logger.logTradeSuccess(actualProfitUSDC);

    } catch (error) {
      this.logger.logError("Error executing trade", error);
    }
  }

  /**
   * Execute x402 payment for premium content
   */
  private async executeX402Payment(): Promise<void> {
    try {
      this.logger.logX402PaymentStart();
      const x402Result = await this.dependencies.buyer.buyContent(config.x402.paymentUrl);
      
      if (x402Result) {
        this.logger.logX402PaymentSuccess(x402Result);
      } else {
        this.logger.logX402PaymentWarning("Payment completed but no content received");
      }
    } catch (error) {
      this.logger.logError("Failed to execute x402 payment", error);
    }
  }

  /**
   * Get current session statistics
   */
  getStats() {
    return {
      txCount: this.txCount,
      sessionProfit: this.sessionProfit,
      uptime: Date.now() - this.startTime,
      isRunning: this.loop !== undefined
    };
  }

  /**
   * Display final statistics (exposed for external use)
   */
  displayFinalStats(): void {
    this.logger.displayFinalStats(this.getStats());
  }
}
