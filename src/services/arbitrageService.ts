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
  }

  /**
   * Initialize the arbitrage service
   */
  async initialize(): Promise<void> {
    this.displayStartupInfo();
    
    // Initialize wallet balance (only for mock wallets)
    if (config.environment.useMocks && this.dependencies.wallet.addToBalance) {
      this.dependencies.wallet.addToBalance(
        config.tokens.MAIN_TOKEN_ADDRESS as `0x${string}`, 
        Number(this.amountIn)
      );
    }
  }

  /**
   * Start the arbitrage bot with periodic trading checks
   */
  start(): void {
    console.log("🚀 Starting arbitrage bot...");
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
      console.log("🛑 Arbitrage bot stopped");
    }
  }

  /**
   * Execute a single arbitrage cycle
   */
  private async executeArbitrageCycle(): Promise<void> {
    try {
      const inputAmount = this.amountIn;

      // Step 1: Get WETH from CDP
      console.log("Getting WETH from CDP...");
      const wethFromCDP = await this.dependencies.cdpProvider.estimatePrice(
        inputAmount, 
        config.tokens.MAIN_TOKEN_ADDRESS as `0x${string}`, 
        config.tokens.SECONDARY_TOKEN_ADDRESS as `0x${string}`
      );

      if (!wethFromCDP) {
        console.error("Failed to get WETH price from CDP");
        return;
      }

      // Step 2: Get USDC from DEX using the WETH amount
      console.log("Getting USDC from DEX...");
      const usdcFromDEX = await this.dependencies.customDEXProvider.estimatePrice(
        wethFromCDP, 
        config.tokens.SECONDARY_TOKEN_ADDRESS as `0x${string}`, 
        config.tokens.MAIN_TOKEN_ADDRESS as `0x${string}`
      );

      if (!usdcFromDEX) {
        console.error("Failed to get USDC price from DEX");
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
      this.logTradeOpportunity({
        amountIn: inputAmount,
        amountOut: usdcFromDEX,
        netProfit,
        profitPercentage,
        gasUsed: 0n // Will be updated if trade is executed
      }, shouldExecute);

      // Check if target profit reached
      if (this.sessionProfit >= Number(formatUnits(this.balanceOut, this.USDC_DECIMALS))) {
        console.log(`🎯 Target profit reached! Stopping bot...`);
        this.stop();
      }

    } catch (error) {
      console.error("Error in arbitrage cycle:", error);
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
      console.log("🔄 Executing profitable trade...");

      // Execute first swap: USDC -> WETH via CDP
      const actualWeth = await this.dependencies.cdpProvider.executeSwap(
        inputAmount,
        config.tokens.MAIN_TOKEN_ADDRESS as `0x${string}`,
        config.tokens.MAIN_TOKEN_SYMBOL,
        config.tokens.SECONDARY_TOKEN_ADDRESS as `0x${string}`
      );

      if (!actualWeth) {
        console.error("First swap failed");
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
        console.error("Second swap failed");
        return;
      }

      // Calculate actual profit
      const actualProfit = actualOutput - inputAmount;
      const actualProfitUSDC = Number(formatUnits(actualProfit, this.USDC_DECIMALS));
      
      this.sessionProfit += actualProfitUSDC;
      this.txCount++;

      console.log(`✅ Trade executed successfully! Profit: ${actualProfitUSDC.toFixed(6)} USDC`);

    } catch (error) {
      console.error("Error executing trade:", error);
    }
  }

  /**
   * Log trade opportunity with formatted output
   */
  private logTradeOpportunity(result: TradeResult, willExecute: boolean): void {
    const timestamp = new Date().toLocaleString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    const protocols = `${this.dependencies.cdpProvider.name} → ${this.dependencies.customDEXProvider.name}`;
    const amounts = `${Number(formatUnits(result.amountIn, this.USDC_DECIMALS)).toFixed(2)} → ${Number(formatUnits(result.amountOut, this.USDC_DECIMALS)).toFixed(2)}`;
    const pnl = `${result.profitPercentage >= 0 ? '+' : ''}${result.profitPercentage.toFixed(3)}%`;
    const profit = `${result.netProfit >= 0n ? '+' : ''}${Number(formatUnits(result.netProfit, this.USDC_DECIMALS)).toFixed(6)}`;
    const balance = `${this.sessionProfit.toFixed(6)}`;
    const action = willExecute ? "🚀 SWAP EXECUTED" : "⏸️  NO SWAP";

    console.log(` ${timestamp} | ${this.txCount.toString().padStart(2)} | ${protocols.padEnd(20)} | ${amounts.padEnd(11)} | ${pnl.padEnd(7)} ${profit.padStart(8)} | ${balance.padStart(7)} | ${action}`);
  }

  /**
   * Display startup information
   */
  private displayStartupInfo(): void {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(` Network: ${config.network.name} | Wallet: ${config.address}`);
    console.log(` Main token ( ${config.tokens.MAIN_TOKEN_SYMBOL}): ${config.tokens.MAIN_TOKEN_ADDRESS} | Start: ${Number(formatUnits(this.amountIn, 6)).toFixed(2)} USDC`);
    console.log(` Target profit: +${Number(formatUnits(BigInt(this.balanceOut), 6)).toFixed(2)} (${((Number(this.balanceOut) / Number(this.amountIn)) * 100).toFixed(0)} %)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Display trading log header
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(" Date                | # | Protocols | In → Out    | PnL            | Balance | Profit     ");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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
}
