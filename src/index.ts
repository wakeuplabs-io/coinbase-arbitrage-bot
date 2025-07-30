/**
 * Decentralized Finance (DeFi) Arbitrage Bot
 * 
 * This application performs automated arbitrage trading between different DeFi protocols
 * (CDP and Uniswap) to identify and execute profitable trading opportunities.
 * 
 * The bot can operate in two modes:
 * - Mock mode: Uses simulated providers for testing and development
 * - Production mode: Uses real blockchain providers for live trading
 * 
 * @author sebaleoperez
 * @version 1.0.0
 */

import { config } from './config';
import { log } from './utils/logger';
import { x402FetchBuyer } from './buyers/x402FetchBuyer';
import { CDPProvider } from './providers/cdp';
import { formatUnits, parseUnits } from 'viem';
import { MockWallet } from './mocks/mockWallet';
import { MockCDPProvider } from './mocks/mockCDPProvider';
import { MockUniswapProvider } from './mocks/mockUniswapProvider';
import { MockPayment } from './mocks/mockPayment';
import { Web3Wallet } from './wallets/web3Wallet';
import { SwapProvider } from './interfaces/swapProvider';
import { ContentPayment } from './interfaces/contentPayment';
import { Wallet } from './interfaces/wallet';
import { CustomDEXProvider } from './providers/customDEX';

// Global variables for bot state management
let loop: NodeJS.Timeout | undefined;
let txCount = 0;
const startTime = Date.now();

// Convert target balance to USDC format (6 decimals)
const balanceOut = parseUnits(config.trading.targetBalanceOut.toString(), 6);
const amountIn = parseUnits(config.trading.amountIn.toString(), 6);

// Initialize providers based on configuration
let cdpProvider: SwapProvider;
let customDEXProvider: SwapProvider;
let buyer: ContentPayment;
let wallet: Wallet;
let sessionProfit = 0;

/**
 * Initialize providers based on the environment configuration.
 * Uses mock implementations for development/testing or production implementations for live trading.
 */
if (config.environment.useMocks) {
  console.log("🔧 Using mock implementations");
  cdpProvider = new MockCDPProvider();
  customDEXProvider = new MockUniswapProvider();
  buyer = new MockPayment();
  wallet = new MockWallet();
} else {
  console.log("🚀 Using production implementations");
  cdpProvider = new CDPProvider();
  customDEXProvider = new CustomDEXProvider();
  buyer = new x402FetchBuyer();
  wallet = new Web3Wallet();
}

// Display bot configuration and startup information
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(` Network: ${config.network.name} | Wallet: ${config.address}`);
console.log(` Main token (USDC): ${config.tokens.USDC} | Start: ${Number(formatUnits(amountIn,6)).toFixed(2)} USDC`);
console.log(` Target profit: +${Number(formatUnits(BigInt(balanceOut), 6)).toFixed(2)} (${((Number(balanceOut) / Number(amountIn)) * 100).toFixed(0)} %)`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// Display trading log header
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(" Date                | # | Protocols | In → Out    | PnL            | Balance | Profit     ");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// Initialize wallet balance (only for mock wallets)
if (config.environment.useMocks && wallet.addToBalance) {
  wallet.addToBalance(config.tokens.USDC as `0x${string}`, Number(amountIn));
}

// Constants for better code readability
const USDC_DECIMALS = 6;

/**
 * Trade execution result interface for type safety
 */
interface TradeResult {
  amountIn: bigint;
  amountOut: bigint;
  netProfit: bigint;
  profitPercentage: number;
  protocols: string;
  success: boolean;
}

/**
 * Estimates arbitrage prices between CDP and DEX providers.
 * 
 * @param inputAmount - Amount to trade in USDC (with decimals)
 * @returns Promise<TradeResult> - Complete trade estimation result
 */
const estimateArbitrageOpportunity = async (inputAmount: bigint): Promise<TradeResult> => {
  try {
    // Step 1: Get price from CDP (USDC → WETH)
    const wethFromCDP = await cdpProvider.estimatePrice(
      inputAmount, 
      config.tokens.USDC as `0x${string}`, 
      config.tokens.WETH as `0x${string}`
    );

    if (!wethFromCDP) {
      throw new Error('CDP price estimation failed');
    }

    // Step 2: Get price from DEX (WETH → USDC)
    const usdcFromDEX = await customDEXProvider.estimatePrice(
      wethFromCDP, 
      config.tokens.WETH as `0x${string}`, 
      config.tokens.USDC as `0x${string}`
    );

    if (!usdcFromDEX) {
      throw new Error('DEX price estimation failed');
    }

    // Step 3: Calculate profit metrics
    const netProfit = usdcFromDEX - inputAmount;
    const profitPercentage = (Number(netProfit) / Number(inputAmount)) * 100;

    return {
      amountIn: inputAmount,
      amountOut: usdcFromDEX,
      netProfit,
      profitPercentage,
      protocols: 'CDP → DEX',
      success: true
    };
  } catch (error) {
    log(`❌ Price estimation failed: ${(error as Error).message}`);
    return {
      amountIn: inputAmount,
      amountOut: 0n,
      netProfit: 0n,
      profitPercentage: 0,
      protocols: 'CDP → DEX',
      success: false
    };
  }
};

/**
 * Executes a profitable arbitrage trade.
 * 
 * @param trade - Trade details from price estimation
 * @returns Promise<TradeResult> - Updated trade result after execution
 */
const executeArbitrageTrade = async (trade: TradeResult): Promise<TradeResult> => {
  // For mock wallets, simulate the trade
  if (wallet.addToBalance) {
    wallet.addToBalance(config.tokens.USDC as `0x${string}`, Number(trade.netProfit));
    return trade;
  }

  try {
    // Step 1: Execute CDP swap (USDC → WETH)
    const wethReceived = await cdpProvider.executeSwap(
      trade.amountIn,
      config.tokens.USDC as `0x${string}`,
      'USDC',
      config.tokens.WETH as `0x${string}`
    );

    if (!wethReceived) {
      throw new Error('CDP swap failed');
    }

    // Step 2: Execute DEX swap (WETH → USDC)
    const finalUSDC = await customDEXProvider.executeSwap(
      wethReceived,
      config.tokens.WETH as `0x${string}`,
      'WETH',
      config.tokens.USDC as `0x${string}`
    );

    if (!finalUSDC) {
      throw new Error('DEX swap failed');
    }

    // Step 4: Calculate actual profit after execution
    const actualProfit = finalUSDC - trade.amountIn;
    const actualProfitPercentage = (Number(actualProfit) / Number(trade.amountIn)) * 100;

    return {
      ...trade,
      amountOut: finalUSDC,
      netProfit: actualProfit,
      profitPercentage: actualProfitPercentage
    };
  } catch (error) {
    log(`❌ Trade execution failed: ${(error as Error).message}`);
    return { ...trade, success: false };
  }
};

/**
 * Logs trade results in a formatted manner.
 * 
 * @param trade - Trade result to log
 * @param txNumber - Transaction number
 * @param currentBalance - Current wallet balance in wei
 * @param totalProfit - Total session profit in decimal format
 */
const logTradeResult = (trade: TradeResult, txNumber: number, currentBalance: bigint, totalProfit: number): void => {
  const status = trade.profitPercentage >= config.trading.profitThreshold ? '✅ SWAP EXECUTED' : '⛔ SWAP NOT EXECUTED';
  
  const amountInFormatted = Number(formatUnits(trade.amountIn, USDC_DECIMALS)).toFixed(2);
  const amountOutFormatted = Number(formatUnits(trade.amountOut, USDC_DECIMALS)).toFixed(2);
  const profitFormatted = Number(formatUnits(trade.netProfit, USDC_DECIMALS)).toFixed(2);
  const balanceFormatted = Number(formatUnits(currentBalance, USDC_DECIMALS)).toFixed(2);
  const sessionProfitFormatted = totalProfit.toFixed(2);

  log(
    `${txNumber.toString().padStart(2)} | ${trade.protocols} | ${amountInFormatted} → ${amountOutFormatted} | ${profitFormatted} (${trade.profitPercentage.toFixed(2)}%) | ${balanceFormatted} | ${sessionProfitFormatted} ${status}`
  );
};

/**
 * Main arbitrage bot execution function.
 * 
 * Performs a single arbitrage cycle:
 * 1. Estimates prices between CDP and DEX
 * 2. Calculates potential profit/loss
 * 3. Executes profitable trades (above threshold)
 * 4. Updates session metrics and logs results
 * 5. Checks for target profit achievement
 * 
 * @returns Promise<void>
 */
const runBot = async (): Promise<void> => {
  txCount++;

  // Step 1: Estimate arbitrage opportunity
  const estimation = await estimateArbitrageOpportunity(BigInt(amountIn));
  
  if (!estimation.success) {
    log(`${txCount.toString().padStart(2)} | ERROR | Price estimation failed`);
    return;
  }

  let finalTrade = estimation;
  // Step 2: Execute trade if profitable
  if (estimation.profitPercentage >= config.trading.profitThreshold) {
    finalTrade = await executeArbitrageTrade(estimation);
  }

  // Step 3: Update session metrics
  const currentBalance = await wallet.getBalance(config.tokens.USDC as `0x${string}`);
  if (finalTrade.netProfit > 0) {
    sessionProfit += Number(formatUnits(finalTrade.netProfit, USDC_DECIMALS));
  }

  // Step 4: Log trade results
  logTradeResult(finalTrade, txCount, BigInt(currentBalance), sessionProfit);

  // Step 5: Check if target profit has been reached
  if (sessionProfit >= Number(formatUnits(balanceOut, USDC_DECIMALS))) {
    await handleTargetReached();
  }
};

/**
 * Handles the completion of trading when target profit is reached.
 * Displays final statistics and executes x402 payment.
 */
const handleTargetReached = async (): Promise<void> => {
  clearInterval(loop as NodeJS.Timeout);

  // Calculate final session statistics
  const runtimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const roi = (sessionProfit / Number(formatUnits(BigInt(amountIn), USDC_DECIMALS))) * 100;

  // Display final results
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log(`🎯 Target reached in ${txCount} trades | Runtime: ${new Date(runtimeSeconds * 1000).toISOString().substr(14, 5)}`);
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log(`   Net Profit:    ${sessionProfit.toFixed(2)} USDC`);
  log(`   ROI:           ${(roi.toFixed(2) + ' %').padStart(10)}`);
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Execute x402 payment for premium content
  try {
    const x402res = await buyer.buyContent(config.x402.paymentUrl);
    log(`🔗 x402pay – ✅ Done`);
    log(`📄 Content: ${JSON.stringify(x402res)}`);
  } catch (err) {
    log(`❌ Error creating payment via x402: ${(err as Error).message}`);
  }
};

// Start the arbitrage bot with configured frequency
loop = setInterval(runBot, config.trading.frequencyMs);