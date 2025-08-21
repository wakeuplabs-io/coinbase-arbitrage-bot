/**
 * Configuration Management
 *
 * This module centralizes all application configuration settings,
 * loading them from environment variables with sensible defaults.
 * Uses Zod for runtime validation to ensure configuration integrity.
 *
 * @module config
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import { base, mainnet } from 'viem/chains';

dotenv.config();

const configSchema = z.object({
  privateKey: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Private key must be in 0x format with 64 hex characters'),
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Wallet address must be in 0x format with 40 hex characters'),
  account_name: z.string().min(1, 'Account name is required'),
  public_node: z.string().url('Public node must be a valid URL').optional().or(z.literal('')),

  cdp: z.object({
    apiKeyId: z.string().min(1, 'CDP API key ID is required'),
    apiKeySecret: z.string().min(1, 'CDP API key secret is required'),
    walletSecret: z.string().min(1, 'CDP wallet secret is required'),
  }),

  tokens: z.object({
    MAIN_TOKEN_ADDRESS: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid main token address format'),
    MAIN_TOKEN_SYMBOL: z.string().min(1, 'Main token symbol is required'),
    MAIN_TOKEN_DECIMALS: z.number().min(0).max(18, 'Token decimals must be between 0 and 18'),
    SECONDARY_TOKEN_ADDRESS: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid secondary token address format'),
    SECONDARY_TOKEN_SYMBOL: z.string().min(1, 'Secondary token symbol is required'),
    SECONDARY_TOKEN_DECIMALS: z.number().min(0).max(18, 'Token decimals must be between 0 and 18'),
  }),

  contracts: z.object({
    uniswapQuoter: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Uniswap quoter address format'),
    uniswapRouter: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Uniswap router address format'),
    permit2: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Permit2 address format'),
  }),

  trading: z.object({
    amountIn: z.number().positive('Amount in must be positive'),
    profitThreshold: z.number().min(0, 'Profit threshold must be non-negative'),
    frequencyMs: z.number().positive('Frequency must be positive'),
    slippageBps: z.number().min(0).max(10000, 'Slippage must be between 0 and 10000 basis points'),
    swapFee: z.number().min(0, 'Swap fee must be non-negative'),
    targetBalanceOut: z.number().positive('Target balance out must be positive'),
  }),

  network: z.object({
    name: z.enum(['base', 'ethereum'], {
      invalid_type_error: 'Network name must be either base or ethereum',
      required_error: 'Network name is required',
    }),
  }),

  x402: z.object({
    paymentUrl: z.string().url('X402 payment URL must be a valid URL'),
  }),

  environment: z.object({
    useMocks: z.boolean(),
  }),
});

/**
 * Type inference from the Zod schema
 */
export type Config = z.infer<typeof configSchema>;

const rawConfig = {
  privateKey: process.env.PRIVATE_KEY || '',
  address: process.env.ADDRESS || '',
  account_name: process.env.ACCOUNT_NAME || 'test-account',
  public_node: process.env.PUBLIC_NODE || '',

  cdp: {
    apiKeyId: process.env.CDP_API_KEY_ID || '',
    apiKeySecret: process.env.CDP_API_KEY_SECRET || '',
  },

  tokens: {
    MAIN_TOKEN_ADDRESS:
      process.env.MAIN_TOKEN_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    MAIN_TOKEN_SYMBOL: process.env.MAIN_TOKEN_SYMBOL || 'USDC',
    MAIN_TOKEN_DECIMALS: parseInt(process.env.MAIN_TOKEN_DECIMALS || '6'),
    SECONDARY_TOKEN_ADDRESS:
      process.env.SECONDARY_TOKEN_ADDRESS || '0x4200000000000000000000000000000000000006',
    SECONDARY_TOKEN_SYMBOL: process.env.SECONDARY_TOKEN_SYMBOL || 'WETH',
    SECONDARY_TOKEN_DECIMALS: parseInt(process.env.SECONDARY_TOKEN_DECIMALS || '18'),
  },

  contracts: {
    uniswapQuoter:
      process.env.UNISWAP_QUOTER_ADDRESS || '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    uniswapRouter:
      process.env.UNISWAP_ROUTER_ADDRESS || '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    permit2: process.env.PERMIT2_ADDRESS || '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  },

  trading: {
    amountIn: parseInt(process.env.AMOUNT_IN || '1'),
    profitThreshold: parseFloat(process.env.PROFIT_THRESHOLD || '0.1'),
    frequencyMs: parseInt(process.env.FREQUENCY_MS || '10000'),
    slippageBps: parseInt(process.env.SLIPPAGE_BPS || '100'),
    swapFee: parseInt(process.env.SWAP_FEE || '500'),
    targetBalanceOut: parseFloat(process.env.TARGET_BALANCE_OUT || '1'),
  },

  network: {
    name: process.env.NETWORK || 'base',
  },

  x402: {
    paymentUrl: process.env.X402_PAYMENT_URL || 'http://localhost:4021/weather',
  },

  environment: {
    useMocks: process.env.USE_MOCKS === 'true' || false,
  },
};

/**
 * Validated and type-safe configuration object.
 * This will throw an error if any required configuration is missing or invalid.
 */
function createConfig(): Config {
  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach(err => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Main application configuration object.
 * Contains all settings needed for the arbitrage bot operation.
 * Validated at runtime using Zod for type safety and data integrity.
 */
export const config = createConfig();

export const chain = config.network.name === 'base' ? base : mainnet;
