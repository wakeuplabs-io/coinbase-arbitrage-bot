import { Address } from 'viem';
import { SwapProvider } from '../interfaces/swapProvider';

export class MockUniswapProvider implements SwapProvider {

  private lastEstimatedPrice: bigint | undefined;

  estimatePrice(
    amountIn: bigint,
    tokenIn: Address,
    tokenOut: Address,
  ): Promise<bigint | undefined> {
    // Simulate a random price estimation between 1.01 and 1.05 times the input amount
    const randomFactor = 1.01 + Math.random() * 0.04;
    this.lastEstimatedPrice = BigInt(Math.round(Number(amountIn) * randomFactor));
    return Promise.resolve(this.lastEstimatedPrice);
  }

  executeSwap(
    amountIn: bigint,
    tokenIn: Address,
    tokenOut: Address
  ): Promise<bigint | undefined> {
    if (this.lastEstimatedPrice === undefined) {
      return this.estimatePrice(amountIn, tokenIn, tokenOut);
    }
    return Promise.resolve(this.lastEstimatedPrice);
  }

  readonly name = 'MockUniswap';
}
