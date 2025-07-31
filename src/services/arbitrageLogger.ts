/**
 * Arbitrage Logger Service
 * 
 * This service handles all logging and formatted output for the arbitrage bot,
 * providing consistent formatting and separation of logging concerns.
 * 
 * @module arbitrageLogger
 */

import { formatUnits } from 'viem';
import { config } from '../config';
import { TradeResult } from './arbitrageService';

/**
 * Bot statistics interface for logging
 */
export interface BotStats {
  txCount: number;
  sessionProfit: number;
  uptime: number;
  isRunning: boolean;
}

/**
 * Arbitrage logger service that handles all bot output formatting
 */
export class ArbitrageLogger {
  private readonly USDC_DECIMALS = 6;

  /**
   * Display bot startup information and configuration
   */
  displayStartupInfo(amountIn: bigint, balanceOut: bigint): void {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(` Network: ${config.network.name} | Wallet: ${config.address}`);
    console.log(` Main token ( ${config.tokens.MAIN_TOKEN_SYMBOL}): ${config.tokens.MAIN_TOKEN_ADDRESS} | Start: ${Number(formatUnits(amountIn, 6)).toFixed(2)} USDC`);
    console.log(` Target profit: +${Number(formatUnits(BigInt(balanceOut), 6)).toFixed(2)} (${((Number(balanceOut) / Number(amountIn)) * 100).toFixed(0)} %)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }

  /**
   * Display trading log header
   */
  displayTradingHeader(): void {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(" Date                | # | Protocols | In → Out    | PnL            | Balance | Profit     ");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }

  /**
   * Log a trade opportunity with formatted output
   */
  logTradeOpportunity(
    result: TradeResult, 
    willExecute: boolean, 
    txCount: number, 
    sessionProfit: number,
    cdpProviderName: string,
    dexProviderName: string
  ): void {
    const timestamp = new Date().toLocaleString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    const protocols = `${cdpProviderName} → ${dexProviderName}`;
    const amounts = `${Number(formatUnits(result.amountIn, this.USDC_DECIMALS)).toFixed(2)} → ${Number(formatUnits(result.amountOut, this.USDC_DECIMALS)).toFixed(2)}`;
    const pnl = `${result.profitPercentage >= 0 ? '+' : ''}${result.profitPercentage.toFixed(3)}%`;
    const profit = `${result.netProfit >= 0n ? '+' : ''}${Number(formatUnits(result.netProfit, this.USDC_DECIMALS)).toFixed(6)}`;
    const balance = `${sessionProfit.toFixed(6)}`;
    const action = willExecute ? "🚀 SWAP EXECUTED" : "⏸️  NO SWAP";

    console.log(` ${timestamp} | ${txCount.toString().padStart(2)} | ${protocols.padEnd(20)} | ${amounts.padEnd(11)} | ${pnl.padEnd(7)} ${profit.padStart(8)} | ${balance.padStart(7)} | ${action}`);
  }

  /**
   * Log bot startup message
   */
  logBotStart(): void {
    console.log("🚀 Starting arbitrage bot...");
  }

  /**
   * Log bot stop message
   */
  logBotStop(): void {
    console.log("🛑 Arbitrage bot stopped");
  }

  /**
   * Log target profit reached
   */
  logTargetReached(): void {
    console.log(`🎯 Target profit reached! Stopping bot...`);
  }

  /**
   * Log successful trade execution
   */
  logTradeSuccess(profitUSDC: number): void {
    console.log(`✅ Trade executed successfully! Profit: ${profitUSDC.toFixed(6)} USDC`);
  }

  /**
   * Log trade execution start
   */
  logTradeExecution(): void {
    console.log("🔄 Executing profitable trade...");
  }

  /**
   * Log price estimation steps
   */
  logPriceEstimation(step: string): void {
    console.log(`Getting ${step}...`);
  }

  /**
   * Log error messages
   */
  logError(message: string, error?: unknown): void {
    if (error) {
      console.error(`❌ ${message}:`, error);
    } else {
      console.error(`❌ ${message}`);
    }
  }

  /**
   * Log info messages
   */
  logInfo(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  /**
   * Log warning messages
   */
  logWarning(message: string): void {
    console.warn(`⚠️  ${message}`);
  }

  /**
   * Display final session statistics
   */
  displayFinalStats(stats: BotStats): void {
    const uptimeMinutes = Math.floor(stats.uptime / 1000 / 60);
    const uptimeSeconds = Math.floor((stats.uptime / 1000) % 60);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("                            FINAL SESSION STATS                          ");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Total Transactions: ${stats.txCount}`);
    console.log(`💰 Session Profit: ${stats.sessionProfit.toFixed(6)} USDC`);
    console.log(`⏱️  Runtime: ${uptimeMinutes}m ${uptimeSeconds}s`);
    console.log(`📈 Status: ${stats.isRunning ? 'Running' : 'Stopped'}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }

  /**
   * Display environment and mode information
   */
  displayEnvironmentInfo(): void {
    const mode = config.environment.useMocks ? 'Mock' : 'Production';
    console.log("🚀 Starting DeFi Arbitrage Bot...");
    console.log(`📊 Environment: ${mode} mode`);
  }

  /**
   * Display container configuration
   */
  displayContainerInfo(containerType: string): void {
    console.log(`🔧 Container configured with ${containerType} implementations`);
  }

  /**
   * Log graceful shutdown messages
   */
  logGracefulShutdown(signal: string, stats?: BotStats): void {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    if (stats) {
      console.log(`📊 Final stats: ${stats.txCount} transactions, ${stats.sessionProfit.toFixed(6)} USDC profit`);
    }
  }

  /**
   * Log x402 payment related messages
   */
  logX402PaymentStart(): void {
    console.log("💳 Executing x402 payment for premium content...");
  }

  logX402PaymentSuccess(content?: string): void {
    console.log("✅ x402 payment completed successfully");
    if (content) {
      console.log(`📄 Content received: ${content}`);
    }
  }

  logX402PaymentWarning(message: string): void {
    console.warn(`⚠️  x402 payment: ${message}`);
  }
}
