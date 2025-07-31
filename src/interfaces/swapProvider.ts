/**
 * Swap Provider Interface
 * 
 * Defines the contract for DEX (Decentralized Exchange) implementations
 * that can estimate prices, execute swaps, and calculate gas fees.
 * 
 * @interface SwapProvider
 */

import { type Address } from "viem";

/**
 * Interface for decentralized exchange swap providers.
 * Implementations should provide price estimation, swap execution, and gas fee calculation.
 */
export interface SwapProvider {
  /**
   * Estimate the output amount for a given input amount and token pair.
   * 
   * @param amountIn - Input amount in smallest unit (wei for ETH, base units for tokens)
   * @param tokenIn - Input token address 
   * @param tokenOut - Output token address 
   * @returns Promise resolving to output amount in smallest unit, or undefined if estimation fails
   */
  estimatePrice(amountIn: bigint, tokenIn: Address, tokenOut: Address): Promise<bigint | undefined>;

  /**
   * Execute a token swap on the decentralized exchange.
   * 
   * @param amountIn - Input amount in smallest unit
   * @param tokenIn - Input token contract address
   * @param tokenOut - Output token contract address
   * @returns Promise resolving to actual output amount, or undefined if swap fails
   */
  executeSwap(
    amountIn: bigint,
    tokenIn: Address,
    tokenOut: Address
  ): Promise<bigint | undefined>;

  /**
   * Human-readable protocol identifier (e.g., "Uniswap v3", "CDP").
   */
  readonly name: string;
}