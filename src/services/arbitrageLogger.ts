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
import { TokenUtils } from '../utils/tokenUtils';
import { event, success, info, warn, error as logErrorFn } from '../utils/logger';

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
  private readonly MAIN_TOKEN_DECIMALS = TokenUtils.getDecimals(config.tokens.MAIN_TOKEN_SYMBOL);

  /**
   * Display bot startup information and configuration
   */
  displayStartupInfo(amountIn: bigint, balanceOut: bigint): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(` Network: ${config.network.name} | Wallet: ${config.address}`);
    console.log(
      ` Main token ( ${config.tokens.MAIN_TOKEN_SYMBOL}): ${config.tokens.MAIN_TOKEN_ADDRESS} | Start: ${Number(formatUnits(amountIn, 6)).toFixed(2)} USDC`,
    );
    console.log(
      ` Target profit: +${Number(formatUnits(BigInt(balanceOut), 6)).toFixed(2)} (${((Number(balanceOut) / Number(amountIn)) * 100).toFixed(0)} %)`,
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Display trading log header
   */
  displayTradingHeader(): void {
    console.log(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    );
    console.log(
      ' Date                | # | Protocols | In → Out    | PnL            | Balance | Profit     ',
    );
    console.log(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    );
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
    dexProviderName: string,
  ): void {
    const timestamp = new Date().toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const protocols = `${cdpProviderName} → ${dexProviderName}`;
    const amounts = `${Number(formatUnits(result.amountIn, this.MAIN_TOKEN_DECIMALS)).toFixed(2)} → ${Number(formatUnits(result.amountOut, this.MAIN_TOKEN_DECIMALS)).toFixed(2)}`;
    const pnl = `${result.profitPercentage >= 0 ? '+' : ''}${result.profitPercentage.toFixed(3)}%`;
    const profit = `${result.netProfit >= 0n ? '+' : ''}${Number(formatUnits(result.netProfit, this.MAIN_TOKEN_DECIMALS)).toFixed(6)}`;
    const balance = `${sessionProfit.toFixed(6)}`;
    const action = willExecute ? '🚀 SWAP EXECUTED' : '⏸️  NO SWAP';

    console.log(
      ` ${timestamp} | ${txCount.toString().padStart(2)} | ${protocols.padEnd(20)} | ${amounts.padEnd(11)} | ${pnl.padEnd(7)} ${profit.padStart(8)} | ${balance.padStart(7)} | ${action}`,
    );
  }

  /**
   * Log bot startup message
   */
  logBotStart(): void {
    event('Starting arbitrage bot...');
  }

  /**
   * Log bot stop message
   */
  logBotStop(): void {
    event('Arbitrage bot stopped');
  }

  /**
   * Log target profit reached
   */
  logTargetReached(): void {
    success('Target profit reached! Stopping bot...');
  }

  /**
   * Log successful trade execution
   */
  logTradeSuccess(profitUSDC: number): void {
    success(`Trade executed successfully! Profit: ${profitUSDC.toFixed(6)} USDC`);
  }

  /**
   * Log trade execution start
   */
  logTradeExecution(): void {
    info('Executing profitable trade...');
  }

  /**
   * Log price estimation steps
   */
  logPriceEstimation(step: string): void {
    info(`Getting ${step}...`);
  }

  /**
   * Log error messages
   */
  logError(message: string, err?: unknown): void {
    if (err) {
      logErrorFn(message, err);
    } else {
      logErrorFn(message);
    }
  }

  /**
   * Log info messages
   */
  logInfo(message: string): void {
    info(message);
  }

  /**
   * Log warning messages
   */
  logWarning(message: string): void {
    warn(message);
  }

  /**
   * Display final session statistics
   */
  displayFinalStats(stats: BotStats): void {
    const uptimeMinutes = Math.floor(stats.uptime / 1000 / 60);
    const uptimeSeconds = Math.floor((stats.uptime / 1000) % 60);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                            FINAL SESSION STATS                          ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total Transactions: ${stats.txCount}`);
    console.log(`💰 Session Profit: ${stats.sessionProfit.toFixed(6)} USDC`);
    console.log(`⏱️  Runtime: ${uptimeMinutes}m ${uptimeSeconds}s`);
    console.log(`📈 Status: ${stats.isRunning ? 'Running' : 'Stopped'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Display environment and mode information
   */
  displayEnvironmentInfo(): void {
    const mode = config.environment.useMocks ? 'Mock' : 'Production';
    event('Starting DeFi Arbitrage Bot...');
    info(`Environment: ${mode} mode`);
  }

  /**
   * Display container configuration
   */
  displayContainerInfo(containerType: string): void {
    info(`Container configured with ${containerType} implementations`);
  }

  /**
   * Log graceful shutdown messages
   */
  logGracefulShutdown(signal: string, stats?: BotStats): void {
    warn(`Received ${signal}, shutting down gracefully...`);
    if (stats) {
      info(`Final stats: ${stats.txCount} transactions, ${stats.sessionProfit.toFixed(6)} USDC profit`);
    }
  }

  /**
   * Log x402 payment related messages
   */
  logX402PaymentStart(): void {
    info('Executing x402 payment for premium content...');
  }

  logX402PaymentSuccess(content?: string): void {
    success('x402 payment completed successfully');
    if (content) {
      info(`Content received: ${content}`);
    }
  }

  logX402PaymentWarning(message: string): void {
    warn(`x402 payment: ${message}`);
  }
}
