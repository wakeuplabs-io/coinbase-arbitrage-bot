/**
 * Mock CDP Provider
 *
 * A mock implementation of the CDP (Coinbase Developer Platform) swap provider
 * for testing and development purposes. Simulates price estimation with random
 * variations to mimic real market conditions.
 *
 * @class MockCDPProvider
 * @implements {SwapProvider}
 */

import { Address } from 'viem';
import { SwapProvider } from '../interfaces/swapProvider';

/**
 * Mock implementation of CDP swap provider for testing.
 * Simulates random price variations between 1.01x and 1.05x of input amount.
 */
export class MockCDPProvider implements SwapProvider {
  /**
   * Estimate token swap price with simulated randomness.
   *
   * @param amountIn - Input amount in base units
   * @param tokenIn - Input token identifier
   * @param tokenOut - Output token identifier
   * @returns Promise resolving to estimated output amount
   */
  estimatePrice(
    amountIn: bigint,
    _tokenIn: Address,
    _tokenOut: Address,
  ): Promise<bigint | undefined> {
    // Simulate a random price estimation between 1.01 and 1.05 times the input amount
    const randomFactor = 1.01 + Math.random() * 0.04;
    const estimatedPrice = BigInt(Math.round(Number(amountIn) * randomFactor));

    return Promise.resolve(estimatedPrice);
  }

  /**
   * Mock swap execution (always returns 0 for testing).
   *
   * @param amountIn - Input amount
   * @param tokenIn - Input token address
   * @param tokenOut - Output token address
   * @returns Promise resolving to 0 (mock implementation)
   */
  executeSwap(amountIn: bigint, tokenIn: Address, tokenOut: Address): Promise<bigint | undefined> {
    const estimatedPrice = this.estimatePrice(amountIn, tokenIn, tokenOut);
    return estimatedPrice;
  }

  /** Provider identification string */
  readonly name = 'MockCDP';
}
