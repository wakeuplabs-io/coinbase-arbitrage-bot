/**
 * Configuration Management
 * 
 * This module centralizes all application configuration settings,
 * loading them from environment variables with sensible defaults.
 * 
 * @module config
 */

import dotenv from 'dotenv';
dotenv.config();

/**
 * Main application configuration object.
 * Contains all settings needed for the arbitrage bot operation.
 */
export const config = {
  // Wallet & Authentication
  /** Private key for wallet transactions (required for production) */
  privateKey: process.env.PRIVATE_KEY || '',
  /** Wallet address for the trading account */
  address: process.env.ADDRESS || '',
  /** Account name identifier */
  account_name: process.env.ACCOUNT_NAME || 'test-account',
  /** Public node RPC URL for blockchain connection */
  public_node: process.env.PUBLIC_NODE || '',
  
  // CDP Settings
  /** Coinbase Developer Platform configuration */
  cdp: {
    /** CDP API key identifier */
    apiKeyId: process.env.CDP_API_KEY_ID || '',
    /** CDP API key secret */
    apiKeySecret: process.env.CDP_API_KEY_SECRET || '',
    /** CDP wallet secret for authentication */
    walletSecret: process.env.CDP_WALLET_SECRET || '',
  },
  
  // Token Addresses
  /** Base network token contract addresses */
  tokens: {
    /** Wrapped Ethereum token address (Base network) */
    WETH: process.env.WETH_ADDRESS || '0x4200000000000000000000000000000000000006',
    /** USD Coin token address (Base network) */
    USDC: process.env.USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  
  // Contract Addresses
  /** Smart contract addresses for DeFi protocols */
  contracts: {
    /** Uniswap V3 Quoter contract for price estimation */
    uniswapQuoter: process.env.UNISWAP_QUOTER_ADDRESS || '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    /** Uniswap V3 Router contract for trade execution */
    uniswapRouter: process.env.UNISWAP_ROUTER_ADDRESS || '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    /** Permit2 contract for token approvals */
    permit2: process.env.PERMIT2_ADDRESS || '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  },
  
  // Trading Parameters
  /** Core trading configuration */
  trading: {
    /** Amount for swap in token units */
    amountIn: parseInt(process.env.AMOUNT_IN || '1'),
    /** Minimum profit threshold percentage to execute trades */
    profitThreshold: parseFloat(process.env.PROFIT_THRESHOLD || '0.1'),
    /** Frequency of bot execution in milliseconds */
    frequencyMs: parseInt(process.env.FREQUENCY_MS || '10000'),
    /** Maximum slippage tolerance in basis points */
    slippageBps: parseInt(process.env.SLIPPAGE_BPS || '100'),
    /** Trading fee for swaps in basis points */
    swapFee: parseInt(process.env.SWAP_FEE || '500'),
    /** Target profit amount to stop trading */
    targetBalanceOut: parseFloat(process.env.TARGET_BALANCE_OUT || '1'),
  },
  
  // Network Settings
  /** Blockchain network configuration */
  network: {
    /** Target blockchain network name */
    name: process.env.NETWORK || 'base',
  },
  
  // x402 Payment Settings
  /** Configuration for x402 micropayment protocol */
  x402: {
    /** URL endpoint for x402 payment requests */
    paymentUrl: process.env.X402_PAYMENT_URL || 'http://localhost:4021/weather',
  },

  // Environment Settings
  /** Environment and deployment configuration */
  environment: {
    /** Toggle between mock and production implementations */
    useMocks: process.env.USE_MOCKS === 'true' || false,
  },
};