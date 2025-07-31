/**
 * Token utilities and transaction helpers
 * 
 * This module provides comprehensive token-related utilities including:
 * - Token configuration and information management
 * - Transaction monitoring and receipts
 * - Token allowance handling for swaps
 * 
 * Token decimals and addresses are read from environment variables for flexible configuration.
 * 
 * @module tokenUtils
 */

import { config } from '../config';
import { CdpClient } from "@coinbase/cdp-sdk";
import { createPublicClient, http, erc20Abi, encodeFunctionData, type Address } from "viem";
import { base, mainnet } from "viem/chains";

/**
 * Token configuration interface
 */
export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

/**
 * Available tokens in the system
 */
export const TOKENS: Record<string, TokenInfo> = {
  [config.tokens.MAIN_TOKEN_SYMBOL]: {
    address: config.tokens.MAIN_TOKEN_ADDRESS,
    symbol: config.tokens.MAIN_TOKEN_SYMBOL,
    decimals: config.tokens.MAIN_TOKEN_DECIMALS,
  },
  [config.tokens.SECONDARY_TOKEN_SYMBOL]: {
    address: config.tokens.SECONDARY_TOKEN_ADDRESS,
    symbol: config.tokens.SECONDARY_TOKEN_SYMBOL,
    decimals: config.tokens.SECONDARY_TOKEN_DECIMALS,
  },
};

/**
 * Utility class for token operations
 */
export class TokenUtils {
  /**
   * Get the number of decimals for a token by symbol
   * @param symbol - The token symbol (e.g., 'USDC', 'WETH')
   * @returns The number of decimals for the token
   * @throws Error if token symbol is not found
   */
  static getDecimals(symbol: string): number {
    const token = TOKENS[symbol];
    if (!token) {
      throw new Error(`Token with symbol '${symbol}' not found. Available tokens: ${Object.keys(TOKENS).join(', ')}`);
    }
    return token.decimals;
  }

  /**
   * Get token information by symbol
   * @param symbol - The token symbol
   * @returns Token information object
   * @throws Error if token symbol is not found
   */
  static getTokenInfo(symbol: string): TokenInfo {
    const token = TOKENS[symbol];
    if (!token) {
      throw new Error(`Token with symbol '${symbol}' not found. Available tokens: ${Object.keys(TOKENS).join(', ')}`);
    }
    return token;
  }

  /**
   * Get token address by symbol
   * @param symbol - The token symbol
   * @returns The token contract address
   * @throws Error if token symbol is not found
   */
  static getAddress(symbol: string): string {
    const token = TOKENS[symbol];
    if (!token) {
      throw new Error(`Token with symbol '${symbol}' not found. Available tokens: ${Object.keys(TOKENS).join(', ')}`);
    }
    return token.address;
  }

  /**
   * Check if a token symbol exists in the configuration
   * @param symbol - The token symbol to check
   * @returns True if the token exists, false otherwise
   */
  static exists(symbol: string): boolean {
    return symbol in TOKENS;
  }

  /**
   * Get all available token symbols
   * @returns Array of available token symbols
   */
  static getAllSymbols(): string[] {
    return Object.keys(TOKENS);
  }

  /**
   * Get all token information
   * @returns Record of all tokens mapped by symbol
   */
  static getAllTokens(): Record<string, TokenInfo> {
    return { ...TOKENS };
  }
}

export const publicClient = createPublicClient({
  chain: config.network.name === "base" ? base : mainnet,
  transport: http(),
});

/**
 * Waits for the transaction receipt of a given transaction hash.
 *
 * @param transactionHash - The hash of the transaction to wait for.
 * @returns A promise that resolves to the transaction receipt once it is available.
 */
export async function waitForReceipt(transactionHash: string) {
    return await publicClient.waitForTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });
}

/**
 * Check token allowance for the Permit2 contract
 * @param owner - The token owner's address
 * @param token - The token contract address
 * @param symbol - The token symbol for logging
 * @returns The current allowance
 */
export async function getAllowance(
  owner: Address, 
  token: Address
): Promise<bigint> {
  try {
    const allowance = await publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [owner, config.contracts.permit2 as Address],
    });
    
    return allowance;
  } catch (error) {
    console.error("Error checking allowance:", error);
    return BigInt(0);
  }
}

/**
 * Handle approval for token allowance if needed
 * This is necessary when swapping ERC20 tokens (not native ETH)
 * The Permit2 contract needs approval to move tokens on your behalf
 * @param ownerAddress - The token owner's address
 * @param tokenAddress - The token contract address
 * @param spenderAddress - The address allowed to spend the tokens
 * @param amount - The amount to approve
 * @param cdpClient - The CDP client instance
 * @returns The transaction receipt
 */
export async function approveTokenAllowance(
  ownerAddress: Address, 
  tokenAddress: Address, 
  spenderAddress: Address, 
  amount: bigint,
  cdpClient: CdpClient
) {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [spenderAddress, amount]
  });
  
  const txResult = await cdpClient.evm.sendTransaction({
    address: ownerAddress,
    network: "base",
    transaction: {
      to: tokenAddress,
      data,
      value: BigInt(0),
    },
  });
  
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txResult.transactionHash,
  });
  
  return receipt;
}

/**
 * Handles token allowance check and approval if needed
 * @param ownerAddress - The address of the token owner
 * @param tokenAddress - The address of the token to be sent
 * @param tokenSymbol - The symbol of the token (e.g., WETH, USDC)
 * @param fromAmount - The amount to be sent
 * @param cdpClient - The CDP client instance
 * @returns A promise that resolves when allowance is sufficient
 */
export async function handleTokenAllowance(
  ownerAddress: Address, 
  tokenAddress: Address,
  fromAmount: bigint
): Promise<void> {

  const cdp = new CdpClient();

  const currentAllowance = await getAllowance(
    ownerAddress, 
    tokenAddress
  );

  if (currentAllowance < fromAmount) {
    await approveTokenAllowance(
      ownerAddress,
      tokenAddress,
      config.contracts.permit2 as Address,
      fromAmount,
      cdp
    );
  }
}
